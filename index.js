var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var userCount = 0;
var PLAYER1_TOTAL_SHIPS = 17;
var PLAYER2_TOTAL_SHIPS = 17;
var currPlayer = "";
var firstShipGrid = {};
var firstHitGrid = {};
var secondShipGrid = {};
var secondHitGrid = {};

var isUser1 = true;

for (i = 0; i < 10; i++) {
	for (j = 0; j < 10; j++) {
		firstShipGrid[i+""+j] = "--";
		firstHitGrid[i+""+j] = "--";
		secondShipGrid[i+""+j] = "--";
		secondHitGrid[i+""+j] = "--";
	}
}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
  
});

app.get('/firstShipGrid', function(req, res, next) {
  res.json({firstShipGrid: firstShipGrid});
});

app.get('/firstHitGrid', function(req, res, next) {
  res.json({firstHitGrid: firstHitGrid});
});

app.get('/secondShipGrid', function(req, res, next) {
  res.json({secondShipGrid: secondShipGrid});
});

app.get('/secondHitGrid', function(req, res, next) {
  res.json({secondHitGrid: secondHitGrid});
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});


function setShips(placements, grid) {

	for (i = 0; i < placements.length; i++) {
		var place = placements[i];
		var len = place[0];
		var startPos = place[1];
		var xCoord = Number(startPos.substring(0,1));
		var yCoord = Number(startPos.substring(1));
		var orientation = place[2];
		//grid[startPos] = "S";
		if (orientation == "horiz") {
			while (len > 0 && yCoord+len <= 9) {
				grid[(xCoord.toString()+yCoord.toString())] = "S";
				yCoord++;
				len--;
			}
		} else if (orientation == "vert") {
			while (len > 0 && xCoord+len <= 9) {
				grid[(xCoord.toString()+yCoord.toString())] = "S";
				xCoord++;
				len--;
			}
		} else { 
		
		}
	}

}

function checkWin(shipCount1, shipCount2) {
	if (shipCount1 <= 0) {
		return "player2";
	}
	if (shipCount2 <= 0) {
		return "player1";
	}
	return "none";
}


var firstShipPlacements = [[5, "01", "horiz"], [4, "32", "vert"], [3, "22", "horiz"], [3, "66", "vert"], [2, "59", "vert"]];
var secondShipPlacements = [[5, "14", "horiz"], [4, "22", "vert"], [3, "55", "horiz"], [3, "65", "vert"], [2, "77", "vert"]];


var player1Ships = PLAYER1_TOTAL_SHIPS;
var player2Ships = PLAYER1_TOTAL_SHIPS;

setShips(firstShipPlacements, firstShipGrid);
setShips(secondShipPlacements, secondShipGrid);

var player1MovesList = [];
var player2MovesList = [];

console.log("Player1 Ship Grid");
for (i = 0; i < 10; i++) {
	for (j = 0; j < 10; j++) {
		process.stdout.write(firstShipGrid[(i.toString()+j.toString())]);
	}
	console.log();
}
console.log("Player1 Hit Grid");
for (i = 0; i < 10; i++) {
	for (j = 0; j < 10; j++) {
		process.stdout.write(firstHitGrid[(i.toString()+j.toString())]);
	}
	console.log();
}
console.log();
console.log("Player2 Ship Grid");
for (i = 0; i < 10; i++) {
	for (j = 0; j < 10; j++) {
		process.stdout.write(secondShipGrid[(i.toString()+j.toString())]);
	}
	console.log();
}
console.log("Player2 Hit Grid");
for (i = 0; i < 10; i++) {
	for (j = 0; j < 10; j++) {
		process.stdout.write(secondHitGrid[(i.toString()+j.toString())]);
	}
	console.log();
}


io.on('connection', function(socket){
	userCount++;
	console.log("user"+userCount+" connected");
  
  socket.on('process move', function(msg){

  	var winString = checkWin(player1Ships, player2Ships);
  	if (winString == "player1") {
  		io.sockets.emit('game over', "player1");
  	}
  	if (winString == "player2") {
  		io.sockets.emit('game over', "player2");
  	}

  	console.log("msg id "+msg.id);
  	console.log("message "+msg);
  	console.log("isUser1 "+isUser1);
    io.emit('chat message', msg);
    
    console.log(typeof 1);
    if (msg.length == 2 && typeof (Number(msg.substring(0,1))) == "number" && typeof (Number(msg.substring(1))) == "number") {
    	console.log("valid input");
    	
    	//check if move is within 10*10 grid
    	var coordsLessThanTen = Number(msg.substring(0,1)) < 10 && Number(msg.substring(0,1)) >= 0 && 
    							Number(msg.substring(1)) < 10 && Number(msg.substring(1)) >= 0;
    							
    	if (coordsLessThanTen) {
    		if (isUser1) {
    			//check if the move is already in the User1 movesList
    			if (player1MovesList.indexOf(msg) == -1) {
    				//reference User2 Ship grid and mark if it's a hit or miss in User1 Hit grid
    				firstHitGrid[msg] = secondShipGrid[msg] == "S" ? "H":"M";
    				player2Ships = secondShipGrid[msg] == "S" ? player2Ships-1:player2Ships;
    				player1MovesList.push(msg);
    				
    				currPlayer = !isUser1? "player1":"player2";
    				isUser1 = !isUser1;	
    				
    			}

    		
    		} else {
    			//check if the move is already in the User2 movesList
    			if (player2MovesList.indexOf(msg) == -1) {
    				//reference User1 Ship grid and mark if it's a hit or miss in User2 Hit grid
    				secondHitGrid[msg] = firstShipGrid[msg] == "S" ? "H":"M";
    				player1Ships = firstShipGrid[msg] == "S" ? player1Ships-1:player1Ships;
    				player2MovesList.push(msg)
    				
    				currPlayer = !isUser1? "player1":"player2";
    				isUser1 = !isUser1;	

    			}
    		}
    		io.sockets.emit('curr player', currPlayer);
    		//isUser1? player1MovesList.push(msg) : player2MovesList.push(msg);
    		console.log("Player1 Ship Grid");
			for (i = 0; i < 10; i++) {
				for (j = 0; j < 10; j++) {
					process.stdout.write(firstShipGrid[(i.toString()+j.toString())]);
				}
				console.log();
			}
			console.log("Player1 Hit Grid");
			for (i = 0; i < 10; i++) {
				for (j = 0; j < 10; j++) {
					process.stdout.write(firstHitGrid[(i.toString()+j.toString())]);
				}
				console.log();
			}
			console.log();
			console.log("Player2 Ship Grid");
			for (i = 0; i < 10; i++) {
				for (j = 0; j < 10; j++) {
					process.stdout.write(secondShipGrid[(i.toString()+j.toString())]);
				}
				console.log();
			}
			console.log("Player2 Hit Grid");
			for (i = 0; i < 10; i++) {
				for (j = 0; j < 10; j++) {
					process.stdout.write(secondHitGrid[(i.toString()+j.toString())]);
				}
				console.log();
			}
    		
    	}
    	
    	
	}
    
    console.log("player1MovesList "+player1MovesList);
    console.log("player2MovesList "+player2MovesList);
    
    
  });
});