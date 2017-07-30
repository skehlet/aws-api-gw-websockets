// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';

// Port where we'll run the websocket server
var webSocketsServerPort = 3000;

// websocket and http servers
const WebSocket = require('ws');
var http = require('http');
const url = require('url');

/**
 * Global variables
 */
// latest 100 messages
var history = [ ];
// list of currently connected clients (users)
var clients = [ ];
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

const wsServer = new WebSocket.Server({ 
    server: server,
    path: '/ws'
});

server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

///**
// * WebSocket server
// */
//var wsServer = new webSocketServer({
//    // WebSocket server is tied to a HTTP server. WebSocket request is just
//    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
//    httpServer: server
//});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('connection', function(connection, request) {
    console.log((new Date()) + ' Connection from origin ' + request.connection.remoteAddress + '.');

    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
//    var connection = request.accept(null, request.origin); 
    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;
    var userName = false;
    var userColor = false;

    console.log((new Date()) + ' Connection accepted.');

    // send back chat history
    if (history.length > 0) {
        connection.send(JSON.stringify( { type: 'history', data: history} ));
    }

    // user sent some message
    connection.on('message', function(message) {
        if (userName === false) { // first message sent by user is their name
            // remember user name
            userName = htmlEntities(message);
            // get random color and send it back to the user
            userColor = colors.shift();
            connection.send(JSON.stringify({ type:'color', data: userColor }));
            console.log((new Date()) + ' User is known as: ' + userName
                        + ' with ' + userColor + ' color.');

        } else { // log and broadcast the message
            console.log((new Date()) + ' Received Message from '
                        + userName + ': ' + message);
            
            // we want to keep history of all sent messages
            var obj = {
                time: (new Date()).getTime(),
                text: htmlEntities(message),
                author: userName,
                color: userColor
            };
            history.push(obj);
            history = history.slice(-100);

            // broadcast message to all connected clients
            var json = JSON.stringify({ type:'message', data: obj });
            for (var i=0; i < clients.length; i++) {
                clients[i].send(json);
            }
        }
    });

    // user disconnected
    connection.on('close', function(connection) {
        if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Peer "
                + connection.remoteAddress + " disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);
            // push back user's color to be reused by another user
            colors.push(userColor);
        }
    });

});
