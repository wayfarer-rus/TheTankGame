/* global $ */

$(function () {
    "use strict";
    var cellSize = 40;
    var content = $('#content');
    var playfield = document.getElementById("playfield"), ctx;
    var gameState;
    var pPos = {x: 10, y: 10};
    
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
        playfield.style.visibility = 'visible';
        playfield.width = 16 * cellSize;
        playfield.height = 15 * cellSize;

        ctx = playfield.getContext('2d');
        
		drawPlayfield();
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
        if (json.type === 'state') {
            gameState = json.obj;
			var newPos = gameState.testRectPos;
			console.log('server pos: [' + newPos.left + ' ; ' + newPos.top + ']');
			setPosition(newPos);
        } else {
            console.log('Hmm..., I\'ve never seen JSON like this: ', json);
        }
    };
    
    /**
     * Send mesage when user presses any control key
     */
    $('html').keydown(function(e) {
		var msg = '';
		var pos = pPos;
		
        if (e.keyCode === 32) { // FIRE (Spacebar)
			// TODO:
        } else if (e.keyCode === 38) { // UP
			msg = JSON.stringify({type:'move', data: 'up'});
			
			if (pos.y - 10 > 0) pos.y -= 10;
		} else if (e.keyCode === 40) { // DOWN
			msg = JSON.stringify({type:'move', data: 'down'});
			
			if (pos.y + 10 < 800 ) pos.y += 10;
		} else if (e.keyCode === 37) { // LEFT
			msg = JSON.stringify({type:'move', data: 'left'});
			
			if (pos.x - 10 > 0) pos.x -= 10;
		} else if (e.keyCode === 39) { // RIGHT
			msg = JSON.stringify({type:'move', data: 'right'});
			
			if (pos.x + 10 < 800) pos.x += 10;
		}
		
		// send the message as an ordinary text
		if (msg) {
		    pos.left = pos.x;
		    pos.top = pos.y;
		    console.log('client pos: [' + pos.left + ' ; ' + pos.top + ']');
		    setPosition(pos);
		    connection.send(msg);
		}
    });
    
    var drawPlayfield = function () {
        ctx.fillStyle = '#ccc';
        ctx.fillRect(0, 0, playfield.width, playfield.height);
        ctx.fillStyle = '#000';
        ctx.fillRect(cellSize, cellSize, 13 * cellSize, 13 * cellSize);
        // draw map
        if (gameState && gameState.map)
        for (var j = 0; j < 26; j++)
        for (var i = 0; i < 26; i++) {
            switch (gameState.map[j][i]) {
                case 1:
                    drawBrick(i * cellSize / 2 + cellSize, j * cellSize / 2 + cellSize, cellSize);
                    break;
                case 2:
                    drawHardBrick(i * cellSize / 2 + cellSize, j * cellSize / 2 + cellSize, cellSize);
                    break;
            }
        }
        
        // draw player
        if (gameState && gameState.testRectPos) {
            ctx.fillStyle = 'white';
            ctx.fillRect(pPos.x,pPos.y,cellSize,cellSize);
        }
    };
    
    // Рисуем часть кирпичной стены
    var drawBrick = function (x, y, cellSize) {
        // Отрисовка основного цвета кирпича
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(x, y, cellSize / 2, cellSize / 2);
        // Отрисовка теней
        ctx.fillStyle = '#CD8500';
        ctx.fillRect(x, y, cellSize / 2, cellSize / 16);
        ctx.fillRect(x, y + cellSize / 4, cellSize / 2, cellSize / 16);
        ctx.fillRect(x + cellSize / 4, y, cellSize / 16, cellSize / 4);
        ctx.fillRect(x + cellSize / 16, y + cellSize / 4, cellSize / 16, cellSize / 4);
        // Отрисовка раствора между кирпичами
        ctx.fillStyle = '#D3D3D3';
        ctx.fillRect(x, y + cellSize / 4 - cellSize / 16, cellSize / 2, cellSize / 16);
        ctx.fillRect(x, y + cellSize / 2 - cellSize / 16, cellSize / 2, cellSize / 16);
        ctx.fillRect(x + cellSize / 4 - cellSize / 16, y, cellSize / 16, cellSize / 4);
        ctx.fillRect(x, y + cellSize / 4 - cellSize / 16, cellSize / 16, cellSize / 4);
    };
    
    // Рисуем часть бетонного блока
    var drawHardBrick = function(x, y, cellSize) {
        // Отрисовка основного фона
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(x, y, cellSize / 2, cellSize / 2);
        // Отрисовка Тени
        ctx.fillStyle = '#909090';
        ctx.beginPath();
        ctx.moveTo(x, y + cellSize / 2);
        ctx.lineTo(x + cellSize / 2, y + cellSize / 2);
        ctx.lineTo(x + cellSize / 2, y);
        ctx.fill();
        // Отрисовка белого прямоугольника сверху
        ctx.fillStyle = '#eeeeee';
        ctx.fillRect(x + cellSize / 8, y + cellSize / 8, cellSize / 4, cellSize / 4);
    };
    
    var redraw = drawPlayfield;
    
    var setPosition = function (newPos) {
        if (newPos.left !== pPos.x || newPos.top !== pPos.y) {
            // apply new pos
            pPos.x = newPos.left;
            pPos.y = newPos.top;
            // redraw();
        }
    };
    
    setInterval(redraw, 1000/60);
    
    /**
     * This method is optional. If the server wasn't able to respond to the
     * in 5 seconds then show some error message to notify the user that
     * something is wrong.
     */
    setInterval(function() {
        if (connection.readyState !== 1) {
            playfield.style.visibility = 'hidden';
            content.html($('<p>', { text: 'Unable to communicate with server =('} ));
        }
    }, 5000);
});