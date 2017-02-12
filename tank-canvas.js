/* global $ */

$(function () {
    "use strict";
    var content = $('#content');
    
    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        content.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
                                    + 'support WebSockets.'} ));
        return;
    }

    // open connection 
	// TODO:: dinamic server name
	var uriName = 'wss://' + window.location.host;
    var connection = new WebSocket(uriName);

    connection.onopen = function () {
		drawPlayfield();
    };

    connection.onerror = function (error) {
        // just in there were some problems with conenction...
        content.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
                                    + 'connection or the server is down.' } ));
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
    };
    
    var drawPlayfield = function () {
        var playfield = document.getElementById("playfield");
        var ctx = playfield.getContext('2d');
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, playfield.width, playfield.height);
    
    };
    
});