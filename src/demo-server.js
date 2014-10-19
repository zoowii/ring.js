var ring = require('./ring');
//var http = require('http');
//
//var server = http.createServer(function (req, res) {
//    res.writeHead(200, {'Content-Type': 'text/plain'});
//    res.end('hi');
//});
//server.listen(3000, '127.0.0.1', function () {
//    console.log('listening at http://127.0.0.1:3000');
//});
var handler = ring.helloHandler;
var adapter = ring.httpAdapter;
adapter(handler, {
    port: 3000,
    onStart: function () {
        console.log('listening at http://127.0.0.1:3000');
    }
});