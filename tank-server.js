// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-tank-server';

// Port where we'll run the websocket server
var webSocketsServerPort = 8080;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

/**
 * Global variables
 */
// list of currently connected clients (users)
var clients = [ ];

var testRectPos = {top: 100, left: 100};
var timerId; // broadcast timer

var finalhandler = require('finalhandler');
var serveStatic = require('serve-static');
var serve = serveStatic("./");

/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Array with some colors
var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
// ... in random order
colors.sort(function(a,b) { return Math.random() > 0.5; } );

/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
    var done = finalhandler(request, response);
    serve(request, response, done);
});
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    var connection = request.accept(null, request.origin); 
    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;

    console.log((new Date()) + ' Connection accepted.');

    // send current position
    connection.sendUTF(JSON.stringify({type: 'rectData', obj: testRectPos}));
    
    // user sent some message
    connection.on('message', function(message) {
        // console.log((new Date()) + ' Received Message ' + message.utf8Data);
		try {
			var userEvent = JSON.parse(message.utf8Data);
		} catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }
		
        if (userEvent.type == 'move') {
// 			console.log('moving...');
			if (userEvent.data === 'up' && testRectPos.top-10 > 0) {
				// move up
				testRectPos.top -=10;
			} else if (userEvent.data === 'down' && testRectPos.top+10 < 800) {
				// move down
				testRectPos.top +=10;
			} else if (userEvent.data === 'left' && testRectPos.left-10 > 0) {
				testRectPos.left -=10;
			} else if (userEvent.data === 'right' && testRectPos.left+10 < 800) {
				testRectPos.left +=10;
			}
		}
		
// 		if (moveCount === 60) {
// 		    moveCount = 0;
//             // broadcast message to all connected clients
//             var json = JSON.stringify({type: 'rectData', obj: testRectPos});
//             for (var i=0; i < clients.length; i++) {
//                 clients[i].sendUTF(json);
//             }
// 		}
    });
    
    timerId = setInterval(function() {
            // broadcast message to all connected clients
            var json = JSON.stringify({type: 'rectData', obj: testRectPos});
            for (var i=0; i < clients.length; i++) {
                clients[i].sendUTF(json);
            }
        }, 1000);
    

    // user disconnected
    connection.on('close', function(connection) {
        clearInterval(timerId);
        console.log((new Date()) + " Peer "
                + connection.remoteAddress + " disconnected.");
        clients.splice(index, 1);
    });

});