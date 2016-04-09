var http_route = require('./any-route/http')
    , _ = require('./underscore')
    , ring = require('./ring')
    , nodePath = require('path');
/**
 * 路由中间件
 * @param handler
 * @param routes 路由表,格式参数any-route. routes中的handler是js函数,第一个参数是request,后面参数是路由匹配的参数值,同时request中增加路由结果
 */
exports.routesMiddleware = function (handler, routes) {
    return function (req) {
        var uri = req.uri;
        var method = req.request_method;
        var reverseResult = http_route.findRoute(routes, method, uri);
        if (!reverseResult) {
            return handler(req);
        }
        req.routeResult = reverseResult;
        req.routeBinding = reverseResult.binding;
        req.routePattern = reverseResult.route;
        req.routeParams = reverseResult.routeParams;
        console.log(uri, method, reverseResult);
        var routeHandler = reverseResult.handler;
        if (ring.isString(routeHandler)) {
            return ring.makeStringRingResponse(routeHandler);
        } else if (_.isFunction(routeHandler)) {
            var args = _.map(reverseResult.binding, function (binding) {
                return binding[1];
            });
            args.unshift(req);
            return routeHandler.apply(this, args);
        } else {
            throw new Error("unknown type of route handler" + routeHandler);
        }
    };
};

/**
 * TODO
 * cookies中间件,把字符串形式的cookies做成可以encode/decode的map
 * @param handler
 * @param algorithm encode/decode的算法
 */
function cookiesMiddleware(handler, algorithm) {
    return handler;
}

/**
 * TODO
 * 文件中间件,增加对文件的回复的支持
 * @param handler
 * @param rootPath
 * @returns {*}
 */
function fileMiddleware(handler) {

}

/**
 * TODO
 * 静态文件中间件,可以把rootPath下的文件作为静态文件返回
 * @param handler
 * @param rootUri
 * @param rootPath
 */
exports.resourceMiddleware = function (handler, rootUri, rootPath) {
    return function (req) {
        var uri = req.uri;
        if (uri.indexOf(rootUri) >= 0) {
            var subUri = uri.substring(uri.indexOf(rootUri) + rootUri.length);
            var path = nodePath.join(rootPath, subUri);
            console.log(path);
            return new ring.File(path);
        } else {
            return handler(req);
        }
    };
};

/**
 * TODO
 * 参数中间件,处理request body中的form-urlencoded/multipart的内容成map,以及处理query-string
 * @param handler
 */
function paramsMiddleware(handler) {
    return handler;
}

/**
 * TODO
 * flash消息中间件,提供flash消息支持
 * @param handler
 */
function flashMiddleware(handler) {
    return handler;
}

/**
 * TODO
 * websocket中间件,提供websocket支持
 * @param handler
 */
function websocketMiddleware(handler) {
    return handler;
}

/**
 * TODO
 * http HEAD请求中间件,转成一个GET请求但是返回body为空
 * @param handler
 */
function headRequestMiddleware(handler) {
    return handler;
}