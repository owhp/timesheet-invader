/*jslint node: true */
/* eslint-env browser */
/*global $ */
/*jslint white: true */
"use strict";
var myCanvasWidth = $("#myCanvas").width();
var myCanvasHeight = $("#myCanvas").height();
var myAvatarSpeedX = myCanvasWidth / 100;
var myAvatarSpeedY = myCanvasHeight / 100;
var myAvatar;
var enemyPool = [];
var bulletPool = [];
var bgm;
var score;
var pew;
var lives;
var fps = 60;
var isGameStarted = false;
/* Initializing intervaltimer to keep track of game states*/

 function IntervalTimer(callback, interval) {
        var timerId, startTime, remaining = 0;
        var state = 0; //  0 = idle, 1 = running, 2 = paused, 3= resumed

        this.pause = function () {
            if (state !== 1) {
                return;
            }

            remaining = interval - (new Date() - startTime);
            window.clearInterval(timerId);
            state = 2;
        };

        this.resume = function () {
            if (state !== 2) 
            {return;}

            state = 3;
            window.setTimeout(this.timeoutCallback, remaining);
        };

        this.timeoutCallback = function () {
            if (state !== 3) {return;}

            callback();

            startTime = new Date();
            timerId = window.setInterval(callback, interval);
            state = 1;
        };

        startTime = new Date();
        timerId = window.setInterval(callback, interval);
        state = 1; /* running */
    }
/*Initializing our Game Area*/
var myGameArea = {
	canvas: $("#myCanvas")[0],
	start: function () {
		this.canvas.width = $("#myCanvas").width();
		this.canvas.height = $("#myCanvas").height();
		this.context = this.canvas.getContext("2d");
		document.body.insertBefore(this.canvas, document.body.childNodes[0]);
		this.frameNo = 0; //initialize frame number 
		this.interval = new IntervalTimer(updateGameArea, 1000 / fps); /*Initializing gameloop*/
        /*Gameloop specific event listeners allowing us to press multiple keys at once*/
		window.addEventListener('keydown', function (e) {
			if (!isGameStarted) {
				// Start the game if it hasn't started yet
				isGameStarted = true;
				return;
			}
		
			myGameArea.keys = (myGameArea.keys || []);
			myGameArea.keys[e.keyCode] = true;
		});
		window.addEventListener('keydown', function (e) {
			myGameArea.keys = (myGameArea.keys || []);
			myGameArea.keys[e.keyCode] = true;
		});
		window.addEventListener('keyup', function (e) {
			myGameArea.keys = (myGameArea.keys || []);
			myGameArea.keys[e.keyCode] = false;
		});
	},
	clear: function () {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	},
	stop: function () {
		clearInterval(this.interval);
	},
	width: function () {
		return this.canvas.width;
	},
	height: function () {
		return this.canvas.height;
	}
};
function showStartScreen() {
    var ctx = myGameArea.context;
    ctx.font = "30px Consolas";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("Controls:", myCanvasWidth / 2, myCanvasHeight / 2);
    ctx.fillText("Arrow Keys to Move, Space to Shoot", myCanvasWidth / 2, myCanvasHeight / 2 + 40);
    ctx.fillText("Don't get hit! ", myCanvasWidth / 2, myCanvasHeight / 2 + 80);
	ctx.fillText("Press any key to start", myCanvasWidth / 2, myCanvasHeight / 2 + 160);
}
//////////////////////////////////////////
/*Initializing Blueprint of GameObjects*/
////////////////////////////////////////
function GameObject(width, height, color, xPos, yPos, type) {
	this.type = type;
	this.width = width;
	this.height = height;
	this.speedX = 0;
	this.speedY = 0;
	this.color = color;
	this.xPos = xPos;
	this.yPos = yPos;
	this.update = function () {
		var ctx = myGameArea.context;

		if (type === "image") {
			this.image = new Image();
			this.image.src = color;
			ctx.drawImage(this.image, this.xPos, this.yPos, this.width, this.height);
		} 
 
		else if (this.type === "text") {
			ctx.font = this.width + " " + this.height;
			ctx.fillStyle = this.color;
			ctx.fillText(this.text, this.xPos, this.yPos);
		}
       else {
			ctx.fillStyle = color;
			ctx.fillRect(this.xPos, this.yPos, this.width, this.height);
		}

	};
	this.newPos = function () {
		this.xPos += this.speedX;
		this.yPos += this.speedY;
	};
	/*Collision detection*/
	/*Wall Collision detection for our avatar*/
	this.collidesWithWall = function () {
		/*collision with left border*/
		if (this.xPos < 0) {
			this.xPos = 0;
		}
		/*collision with top border*/
		if (this.yPos < 0) {
			this.yPos = 0;
		}
		/*collision with rightborder*/
		if (this.xPos + this.width > myGameArea.canvas.width) {
			this.xPos = myGameArea.canvas.width - this.width;
		}
		/*collision with bottomborder*/
		if (this.yPos + this.height > myGameArea.canvas.height) {
			this.yPos = myGameArea.canvas.height - this.height;
		}
	};
	/*Collision detection between GameObjects*/
	this.collidesWithGameObject = function (gameObject) {
		var myLeft = this.xPos;
		var myRight = this.xPos + this.width;
		var myTop = this.yPos;
		var myBottom = this.yPos + this.height;
		var otherObjectLeft = gameObject.xPos;
		var otherObjectRight = gameObject.xPos + gameObject.width;
		var otherObjectTop = gameObject.yPos;
		var otherObjectBottom = gameObject.yPos + gameObject.height;
		if ((myLeft > otherObjectRight) || (myRight < otherObjectLeft) || (myTop > otherObjectBottom) || (myBottom < otherObjectTop)) {
			return false;
		} else {
			return true;
		}
	};
} 

////////////////////////////
/*Misc Helpful Functions */   
//////////////////////////
function EveryInterval(n) {
	if ((myGameArea.frameNo / n) % 1 === 0) {
		return true;
	} else {
		return false;
	}
}

// Extending our avatars features :
function MyAvatar(width, height, color, xPos, yPos, type) {
	GameObject.call(this, width, height, color, xPos, yPos, type);
}
MyAvatar.prototype = {
	lives: 3,
	score: 0,
	moveUp: function () {
		myAvatar.speedY -= myAvatarSpeedY;
	},
	moveDown: function () {
		myAvatar.speedY += myAvatarSpeedY;
	},
	moveLeft: function () {
		myAvatar.speedX -= myAvatarSpeedX;
	},
	moveRight: function () {
		myAvatar.speedX += myAvatarSpeedX;
	},
	stop: function () {
		myAvatar.speedX = 0;
		myAvatar.speedY = 0;
	},
	shoot: function () {
		var pewpew = new Audio("shooting_sound.wav");
        pewpew.play();
		bulletPool.push(new GameObject(15, 30, "beam2.png", (myAvatar.xPos + (myAvatar.width / 2)) - 7.5, myAvatar.yPos - 30, "image"));
	}
};

function AddEnemies(n) {
	var i;
	for (i = 0; i < n; i += 1) {
		var colors = Array("red", "blue", "white", "orange", "black", "yellow", "purple", "green");
		var color = colors[Math.floor(Math.random() * colors.length)];
		/*Enemies coming from above*/
		enemyPool.push(new GameObject(Math.floor(Math.random() * (30 - 10) + 10), Math.floor(Math.random() * (30 - 10) + 10), color, Math.floor(Math.random() * myCanvasWidth), Math.floor(Math.random() * -500)));
	}
}
    
function Sound(src) {
	this.sound = document.createElement("audio");
	this.sound.src = src;
	this.sound.setAttribute("preload", "auto");
	this.sound.setAttribute("controls", "none");
	this.sound.style.display = "none";
	document.body.appendChild(this.sound);
	this.play = function () {
		this.sound.play();
	};
	this.stop = function () {
		this.sound.pause();
	};
}
/*Keyboard events independent of gameloop*/

var isPaused = false;
 $(myGameArea.canvas).on('keydown', function(e) {
    switch (e.which) {
        // key code for left arrow
        case 80: 
            if (isPaused === false){
		myGameArea.interval.pause();
                isPaused = true;
            }else if (isPaused === true)
            {myGameArea.interval.resume();
                 isPaused = false;            }
            break;
    }
});

function showTimesheetMessage() {
    var ctx = myGameArea.context;
    ctx.font = "20px Consolas";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("It was an uphill battle from the start", myCanvasWidth / 2, myCanvasHeight / 2 - 20);
    ctx.fillText("The Intergalactic Timesheet Guards have managed to capture you ", myCanvasWidth / 2, myCanvasHeight / 2 + 20);
	ctx.fillText("They are forcing you to fill in your timesheet",  myCanvasWidth / 2, myCanvasHeight / 2 + 60);
	ctx.fillText("You have no choice, but to comply to their demand",  myCanvasWidth / 2, myCanvasHeight / 2 + 100);
	ctx.fillText("👾👾👾",  myCanvasWidth / 2, myCanvasHeight / 2 + 140);
}

/*
GAMELOOP
*/
function updateGameArea() {
	/*This gets called every 16ms*/
	bgm.play();
	/*Start of by clearing gameArea*/
	myGameArea.clear();
	/*Incrament our frameNo for each gameloop*/
	myGameArea.frameNo += 1;
	/*Set our avatar velocity to 0*/
	myAvatar.stop();


    // If game hasn't started, show the start screen
    if (!isGameStarted) {
        showStartScreen();
        return;
    }
	/*Check for user input*/
    if (myAvatar.lives <= 0) {
        // Stop the game and display the "Time to fill in your timesheet" message
        myGameArea.stop();
        showTimesheetMessage();
        return;  // Exit the function, stopping further updates
    }
	/* TODO Pause game*/
	/*Bullets have a cooldown of 0.25s */
	if (myGameArea.frameNo === 1 || EveryInterval(15)) {
		if (myGameArea.keys && myGameArea.keys[32]) {
			myAvatar.shoot();
            console.log("Shoot");
		}
	}
    
	if (myGameArea.keys && myGameArea.keys[37]) {
		myAvatar.moveLeft();
	}
	if (myGameArea.keys && myGameArea.keys[39]) {
		myAvatar.moveRight();
	}
	if (myGameArea.keys && myGameArea.keys[38]) {
		myAvatar.moveUp();
	}
	if (myGameArea.keys && myGameArea.keys[40]) {
		myAvatar.moveDown();
	}

	/*Add obstacles ever 3 seconds */
	if (myGameArea.frameNo === 1 || EveryInterval(180)) {
		AddEnemies(10);

	}

	/*Update avatars position based on user-input*/
	myAvatar.newPos();
	/*Check Obstacles future positions */
	var i;
	for (i = 0; i < enemyPool.length; i += 1) {
		enemyPool[i].newPos();
		enemyPool[i].speedY = 5;
	}
	for (i = 0; i < bulletPool.length; i += 1) {
		bulletPool[i].newPos();
		bulletPool[i].speedY = -10;
	}
	// Check for collision after assessing future position and before drawing, otherwise avatar butts into wall.
	myAvatar.collidesWithWall();
  /* Increase enemy speed gradually over time */
  var baseSpeed = 2;  // Base speed for enemies
  var speedIncrease = myGameArea.frameNo / 5000;  // Increase speed slowly as the game progresses
  for (var i = 0; i < enemyPool.length; i++) {
	enemyPool[i].newPos();
	enemyPool[i].speedY = baseSpeed + speedIncrease;  // Gradual speed increase
	if (myAvatar.collidesWithGameObject(enemyPool[i])) {
		myAvatar.lives -= 1;
		enemyPool.splice(i, 1);
	}
}
	/*Check collision with our avatar for each enemy */
	for (i = 0; i < enemyPool.length; i += 1) {
		if (myAvatar.collidesWithGameObject(enemyPool[i])) {
			myAvatar.lives -= 1;
			enemyPool.splice(i, 1);
		}
	}
	/*check collision between bullets and enemies*/
	var j = 0;
    try{
	for (i = 0; i < bulletPool.length; i += 1) {
		for (j = 0; j < enemyPool.length; j += 1) {
			if (bulletPool[i].collidesWithGameObject(enemyPool[j])) {
				myAvatar.score += 10;
				enemyPool.splice(j, 1);
				bulletPool.splice(i, 1);
			}
		}
	}
    }
    /*Catch undefined errors*/
    catch(e){
    if(e){
    return true;
    }
}
    /*remove enemies that are off screen*/
    for (i = 0; i < enemyPool.length; i += 1) {
		if (enemyPool[i].yPos > myCanvasHeight) {
			enemyPool.splice(i, 1);
		}
	}
	/*remove bullets that are off screen*/
	for (i = 0; i < bulletPool.length; i += 1) {
		if (bulletPool[i].yPos < 0) {
			bulletPool.splice(i, 1);
		}
	}

	/* Update/Draw GameObject */
	myAvatar.update();

	for (i = 0; i < enemyPool.length; i += 1) {
		enemyPool[i].update();
	}
	for (i = 0; i < bulletPool.length; i += 1) {
		bulletPool[i].update();
    }
	score.text = "SCORE: " + myAvatar.score;
	lives.text = "LIVES: " + myAvatar.lives; // Update lives display
	lives.update();
	score.update();
}

function startGame() {
	/*Initialize components */
	var avatarWidth	= 90;
	var avatarHeight = 70;
	myAvatar = new MyAvatar(avatarWidth, avatarHeight, "spaceship.png", (myCanvasWidth / 2) - (avatarWidth / 2), myCanvasHeight - 80, "image");
	score = new GameObject("20px", "Consolas", "white", 70, 30, "text");
	lives = new GameObject("20px", "Consolas", "white", myCanvasWidth - 70, 30, "text"); 
	bgm = new Sound("Big Blue 8 Bit - F-Zero.mp3");
	pew = new Sound("shooting_sound.wav");    
	/*Start gameloop*/
	myGameArea.start();
	updateGameArea();
}
$(function () {
	startGame();
});