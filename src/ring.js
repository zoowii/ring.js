var http = require('http')
    , url = require('url')
    , _ = require('./underscore')
    , fs = require('fs');

var Promise = require('./promise').Promise;

var helloHandler = function (req) {
    return {
        status: 200,
        headers: {
            'Content-Type': 'text/plain'
        },
        body: 'hello'
    };
};

function createRingRequestFromHttpRequest(httpReq) {
    var urlParts = url.parse(httpReq.url, true);
    var reqBody = new Promise(function (fulFill) {
        httpReq.on('data', function (chunk) {
            fulFill.call(req, 'data', chunk);
        });
        httpReq.on('end', function () {
            fulFill.call(req, 'end', chunk);
        });
    }, this);
    var req = {
        upgrade: httpReq.upgrade,
        server_port: 3000, // TODO
        server_name: 'localhost', // TODO
        remote_addr: 'localhost', // TODO
        uri: urlParts.pathname,
        query_string: urlParts.query,
        scheme: 'http', // TODO
        http_version: httpReq.httpVersion,
        request_method: httpReq.method.toLowerCase(),
        content_type: null, // TODO
        content_length: 0, // TODO
        character_encoding: 'UTF-8', // TODO
        ssl_client_cert: null, // TODO
        headers: httpReq.headers,
        body: reqBody
    };
    return req;
}

function Stream() {
    // 封装流,包装node.js中原本的文件流,网络流,字符流等
    this.callbacks = {};
}

function File(path) {
    this.path = path;
}

/**
 * listen on 'data', 'error' and 'end' event
 * @param eventName
 * @param callback
 */
Stream.prototype.on = function (eventName, callback, context) {
    if (!_.isFunction(callback)) {
        return;
    }
    this.callbacks = this.callbacks || {};
    context = context || this;
    if (_.isUndefined(this.callbacks[eventName])) {
        this.callbacks[eventName] = [];
    }
    this.callbacks[eventName].push(_.bind(callback, context));
};
Stream.prototype.emit = function (eventName, data) {
    this.callbacks = this.callbacks || {};
    var callbackFns = this.callbacks[eventName] || [];
    var args = _.toArray(arguments);
    args.shift();
    var _this = this;
    _.each(callbackFns, function (fn) {
        if (_.isFunction(fn)) {
            fn.apply(_this, args);
        }
    });
};

function FileStream(filepath, encoding) {
    encoding = encoding || 'UTF-8'; // binary file's encoding is null/bytes
    var binary = !encoding || 'bytes';
    var options = {
        encoding: encoding
    };
    if (binary) {
        options.flag = 'rb';
    }
    this.path = filepath;
    this.encoding = encoding;
    this.options = options;
}
FileStream.prototype = new Stream();
FileStream.prototype.start = function () {
    if (this.started) {
        return;
    }
    this.started = true;
    var _this = this;
    var filepath = this.path;
    fs.stat(filepath, function (err, stats) {
        if (err) {
            _this.emit('error', 'File not found');
            _this.emit('end');
            return;
        }
        _this.emit('stats', stats);
        _this.emit('size', stats['size']);
        fs.readFile(filepath, {encoding: _this.encoding}, function (err, data) {
            if (err) {
                _this.emit('error', err);
                return;
            }
            _this.emit('data', data);
        });
    });
};

function isString(obj) {
    return typeof(obj) === 'string';
}

function makeStringRingResponse(str) {
    return {
        status: 200,
        headers: {'Content-Type': 'text/plain'},
        body: str
    };
}

function makeFileRingResponse(file, callback) {
    fs.exists(file.path, function (exists) {
        if (exists) {
            callback({
                status: 200,
                headers: {}, // TODO: using mime-type
                body: file
            });
        } else {
            callback({
                status: 404,
                headers: {},
                body: "File not found"
            });
        }
    });
}

function makeRingResponse(res, callback) {
    if (isString(res)) {
        callback(makeStringRingResponse(res));
        return;
    }
    if (res instanceof File) {
        makeFileRingResponse(res, callback);
        return;
    }
    if (res instanceof Stream) {
        if (res instanceof FileStream) {
            res.start();
            res.on('stats', function (stats) {
                var headers = {'Content-Length': stats['size']};
                callback({
                    status: 200,
                    headers: headers,
                    body: res
                });
            });
            return;
        }
        callback({
            status: 200,
            headers: {},
            body: res
        });
        return;
    }
    callback(res);
}

function sendRingResponseBodyToHttpResponse(body, httpRes) {
    if (_.isUndefined(body)) {
        httpRes.end();
        return;
    }
    if (isString(body)) {
        httpRes.end(body);
        return;
    }
    // 处理body是文件情况
    if (body instanceof File) {
        var fileReadStream = fs.createReadStream(body.path);
        fileReadStream.pipe(httpRes);
        return;
    }
    // 处理body是流的情况
    if (body instanceof Stream) {
        body.on('data', function (data) {
            httpRes.write(data);
        });
        body.on('error', function (err) {
            httpRes.end(err);
        });
        body.on('end', function () {
            httpRes.end();
        });
        return;
    }
    // 处理body是Promise的情况
    if (body instanceof Promise) {
        body.get(function (event, data) {
            if (event === 'data') {
                httpRes.write(data);
            } else if (event === 'end') {
                httpRes.end();
            }
        }, function (err) {
            httpRes.end(err);
        });
        return;
    }
    throw new Error('wrong type of response body ' + body);
}

function sendRingResponseToHttpResponse(res, httpRes) {
    if (res instanceof Promise) {
        res.get(function (res) {
            sendRingResponseToHttpResponse(res, httpRes);
        }, function () {
            httpRes.writeHead(404, 'Failed');
            httpRes.end('404');
        });
        return;
    }
    if (res.body instanceof File && _.isUndefined(res.headers['Content-Length'])) {
        fs.stat(res.body.path, function (err, stats) {
            if (err) {
                res.status = 404;
                res.body = 'File not found';
                sendRingResponseToHttpResponse(res, httpRes);
                return;
            }
            res.status = res.status || 200;
            res.headers['Content-Length'] = stats['size'];
            sendRingResponseToHttpResponse(res, httpRes);
        });
        return;
    }
    httpRes.writeHead(res.status, res.headers);
    sendRingResponseBodyToHttpResponse(res.body, httpRes);
}

var httpAdapter = function (handler, options) {
    options = _.extend({
        host: '127.0.0.1',
        scheme: 'http',
        debug: false,
    }, options);
    var server = http.createServer(function (httpReq, httpRes) {
        var req = createRingRequestFromHttpRequest(httpReq);
        var res = handler(req);
        makeRingResponse(res, function (res) {
            sendRingResponseToHttpResponse(res, httpRes);
        });
        //httpRes.writeHead(200, {'Content-Type': 'text/plain'});
        //httpRes.end('hi');
    });
    return {
        start: function (callback) {
            callback = callback || function () {
            };
            server.listen(options.port, options.host, callback);
        }
    };
};

exports.httpAdapter = httpAdapter;
exports.helloHandler = helloHandler;
exports.Stream = Stream;
exports.isString = isString;
exports.makeStringRingResponse = makeStringRingResponse;
exports.File = File;
exports.Stream = Stream;
exports.FileStream = FileStream;
