var http = require('http'), url = require('url'), _ = require('./underscore');

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
    // TODO: 封装流,包装node.js中原本的文件流,网络流,字符流等
}

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

function sendRingResponseBodyToHttpResponse(body, httpRes) {
    if (_.isUndefined(body)) {
        httpRes.end();
        return;
    }
    if (isString(body)) {
        httpRes.end(body);
        return;
    }
    // TODO: 处理body是文件情况
    if (body instanceof Stream) {
        // TODO
        return;
    }
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
        if (isString(res)) {
            res = makeStringRingResponse(res);
        }
        sendRingResponseToHttpResponse(res, httpRes);
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
