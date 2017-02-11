$(function () {
    "use strict";

    // for better performance - to avoid searching in DOM
    var content = $('#content');
	var testRect = $('#you');

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
    var connection = new WebSocket('ws://127.0.0.1:1337');

    connection.onopen = function () {
		// TODO::
    };

    connection.onerror = function (error) {
        // just in there were some problems with conenction...
        content.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
                                    + 'connection or the server is down.' } ));
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
        // try to parse JSON message. Because we know that the server always returns
        // JSON this should work without any problem but we should make sure that
        // the massage is not chunked or otherwise damaged.
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }

		//console.log(json);	
        // NOTE: if you're not sure about the JSON structure
        // check the server source code above
        if (json.type === 'rectData') {
			var newPos = json.obj;
			
			// apply new pos
			document.getElementById('you').style.left = newPos.left+'px';
			document.getElementById('you').style.top = newPos.top+'px';
			//console.log(testRect);
        } else if (json.type === 'history') {
            
        } else if (json.type === 'message') {
			
        } else {
            console.log('Hmm..., I\'ve never seen JSON like this: ', json);
        }
    };

    /**
     * Send mesage when user presses any control key
     */
    $('html').keydown(function(e) {
		console.log('keyPressed: ' + e.keyCode);
		var msg = '';
		
        if (e.keyCode === 32) { // FIRE (Spacebar)
			// TODO:
        } else if (e.keyCode === 38) { // UP
			msg = JSON.stringify({type:'move', data: 'up'});
		} else if (e.keyCode === 40) { // DOWN
			msg = JSON.stringify({type:'move', data: 'down'});
		} else if (e.keyCode === 37) { // LEFT
			msg = JSON.stringify({type:'move', data: 'left'});
		} else if (e.keyCode === 39) { // RIGHT
			msg = JSON.stringify({type:'move', data: 'right'});
		}
		
		// send the message as an ordinary text
        connection.send(msg);
    });

    /**
     * This method is optional. If the server wasn't able to respond to the
     * in 5 seconds then show some error message to notify the user that
     * something is wrong.
     */
    setInterval(function() {
        if (connection.readyState !== 1) {
			console.log('unable to communicate with server');
        }
    }, 5000);

});