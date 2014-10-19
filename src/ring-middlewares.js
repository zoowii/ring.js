/**
 * TODO
 * 路由中间件
 * @param handler
 * @param routesTable 路由表,格式如下:
 * [
 *   {
 *     context: (optional, string), // 如果有,表示这是一个context路由,
 *     routes: (optional, array), // 在context有的情况下奇效
 *     method: (required, string/array/'*'),
 *     pattern: (required, string),
 *     defaults: (optional, map, default params in pattern)
 *   },
 *   ...
 * ]
 */
function routesMiddleware(handler, routesTable) {

}

/**
 * TODO
 * cookies中间件,把字符串形式的cookies做成可以encode/decode的map
 * @param handler
 * @param algorithm encode/decode的算法
 */
function cookiesMiddleware(handler, algorithm) {

}

/**
 * TODO
 * 静态文件中间件,可以把rootPath下的文件作为静态文件返回
 * @param handler
 * @param rootPath
 */
function resourceMiddleware(handler, rootPath) {

}

/**
 * TODO
 * 参数中间件,处理request body中的form-urlencoded/multipart的内容成map,以及处理query-string
 * @param handler
 */
function paramsMiddleware(handler) {

}

/**
 * TODO
 * flash消息中间件,提供flash消息支持
 * @param handler
 */
function flashMiddleware(handler) {

}

/**
 * TODO
 * websocket中间件,提供websocket支持
 * @param handler
 */
function websocketMiddleware(handler) {

}

/**
 * TODO
 * http HEAD请求中间件,转成一个GET请求但是返回body为空
 * @param handler
 */
function headRequestMiddleware(handler) {

}