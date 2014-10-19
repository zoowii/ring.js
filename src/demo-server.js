var ring = require('./ring');
var ringMiddlewares = require('./ring-middlewares');
var http_route = require('./any-route/http');
var GET = http_route.GET
    , POST = http_route.POST
    , ANY = http_route.ANY
    , context = http_route.context
    , defroutes = http_route.defroutes;
var handler = ring.helloHandler;
var httpAdapter = ring.httpAdapter;
var app = handler;


function helloHandler(req, name) {
    return 'hello, ' + name;
}

app = ringMiddlewares.routesMiddleware(app, defroutes(
    GET('/', 'index', 'index'),
    GET('/hello/:name', helloHandler),
    GET("/test/:id/update", "test-handler", "test"),
    context("/user", [
        GET("/:id/view/:project/:*path", "view_user_handler", "view_user"),
        POST("/:id/view/:project/:*path", "update_user_handler", "update_user")
    ]),
    ANY("/:*path", '404-handler', '404')
));
var server = httpAdapter(app, {
    port: 3000
});
server.start(function () {
    console.log('listening at http://127.0.0.1:3000');
});