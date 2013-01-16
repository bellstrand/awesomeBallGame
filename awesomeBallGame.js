window.requestAnimFrame = (function(){
  return	window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function(callback){
				window.setTimeout(callback,1000/60);
			};
})();
window.cancelRequestAnimFrame = (function(){
	return	window.cancelRequestAnimationFrame ||
			window.webkitCancelRequestAnimationFrame ||
			window.mozCancelRequestAnimationFrame ||
			window.oCancelRequestAnimationFrame ||
			window.msCancelRequestAnimationFrame ||
			window.clearTimeout;
})();

window.Key = {
	pressed: {},
	ENTER:	13,
	LEFT:	37,
	RIGHT:	39,
	P:		80, 

	isDown: function(keyCode, keyCode1){
		return this.pressed[keyCode] || this.pressed[keyCode1];
	},
	onKeydown: function(event){
		this.pressed[event.keyCode] = true;
		switch(event.keyCode){
			case 13:
				Breakout.releaseBalls();
				break;
			case 80:
				Breakout.pause();
				break;
		}
	},
	onKeyup: function(event){
		delete this.pressed[event.keyCode];
	}
};
window.addEventListener('keyup', function(event){window.Key.onKeyup(event)}, false);
window.addEventListener('keydown', function(event){window.Key.onKeydown(event)}, false);

var channel_max = 10,
	audiochannels = [],
	muted = true,
	i;
for(i = 0; i < channel_max; i += 1){
	audiochannels[i] = [];
	audiochannels[i].channel = new Audio();
	audiochannels[i].finished = -1;
}
function play_multi_sound(s){
	var thistime;
	if(muted === false){
		for(i = 0; i < audiochannels.length; i += 1) {
			thistime = new Date();
			if (audiochannels[i].finished < thistime.getTime()){
				audiochannels[i].finished = thistime.getTime() + document.getElementById(s).duration*1000;
				audiochannels[i].channel.src = document.getElementById(s).src;
				audiochannels[i].channel.load();
				audiochannels[i].channel.play();
				break;
			}
		}
	}
}

function Vector(x,y){
	this.x = x || 0;
	this.y = y || 0;
}
Vector.prototype = {
	muls: function(scalar){
		return new Vector(this.x * scalar, this.y * scalar);
	},
	imuls: function(scalar){
		this.x *= scalar;
		this.y *= scalar;
		return this;
	},
	adds: function(scalar){
		return new Vector(this.x + scalar, this.y + scalar);
	},
	iadd: function(vector){
		this.x += vector.x;
		this.y += vector.y;
		return this;
	}
};

function Ball(radius, position, stuck, direction, speed, fireBall, thruBrick){
	this.radius = radius || 10;
	this.position = position || new Vector();
	this.speed = speed || new Vector(300,300);
	this.direction = direction || Math.PI*1.57;
	this.acceleration = 5;
	this.alive = true;
	this.stuck = stuck || false;
	this.fireBall = fireBall || false;
	this.thruBrick = thruBrick || false;
}
Ball.prototype = {
	draw: function(ctx){
		ctx.save();
		ctx.translate(this.position.x, this.position.y);
		ctx.rotate(this.direction+Math.PI);
		if(this.fireBall === true){
			ctx.beginPath();
			ctx.arc(0,0,this.radius+3,-Math.PI/2.2,Math.PI/2.2,true);
			ctx.arc(0,0,this.radius+7,0.4,0.4,true);
			ctx.arc(0,0,this.radius+4,0.2,0.2,true);
			ctx.arc(0,0,this.radius+7,0,0,true);
			ctx.arc(0,0,this.radius+4,-0.2,-0.2,true);
			ctx.arc(0,0,this.radius+7,-0.4,-0.4,true);
			ctx.closePath();
			ctx.fillStyle = '#F70';
			ctx.fill();

			ctx.beginPath();
			ctx.arc(0,0,this.radius+7,0.4,0.4,true);
			ctx.arc(0,0,this.radius+4,0.2,0.2,true);
			ctx.arc(0,0,this.radius+7,0,0,true);
			ctx.arc(0,0,this.radius+4,-0.2,-0.2,true);
			ctx.arc(0,0,this.radius+7,-0.4,-0.4,true);
			ctx.arc(0,0,this.radius+11,-0.15,-0.15,true);
			ctx.arc(0,0,this.radius+9,0,0,true);
			ctx.arc(0,0,this.radius+11,0.15,0.15,true);

			ctx.closePath();
			ctx.fillStyle = '#F00';
			ctx.fill();

			ctx.beginPath();
			ctx.arc(0,0,this.radius,0,Math.PI*2,true);
			ctx.closePath();
			ctx.fillStyle = '#FF0';
			ctx.fill();
		}
		else{
			ctx.beginPath();
			ctx.arc(0,0,this.radius,0,Math.PI*2,true);
			ctx.closePath();
			ctx.fillStyle = '#FFF';
			ctx.fill();
		}
		ctx.restore();
	},
	update: function(paddle, bricks, td, width, height, powerups){
		if(this.stuck === false){
			this.position.x += this.speed.x * Math.cos(this.direction) * td;
			this.position.y += this.speed.y * Math.sin(this.direction) * td;
			this.stayInArea(width, height);
			this.colide(height, paddle, bricks, powerups);
		}
		else{
			this.position.x = paddle.position.x + this.stuck;
		}
	},
	stayInArea: function(width, height){
		if(this.position.y <= this.radius && this.direction > Math.PI){
			this.direction = Math.PI*2-this.direction;
			play_multi_sound('ball-hit-border');
			//console.log(this.direction);
		}
		else if(this.position.y > height+this.radius && this.direction < Math.PI){
			//this.direction = Math.PI*2-this.direction;
			this.alive = false;
			//console.log(this.direction);
		}
		else if(this.position.x > width-this.radius && (this.direction > Math.PI*1.5 || this.direction < Math.PI*0.5)){
			this.direction = (Math.PI+(Math.PI*2-this.direction))%(Math.PI*2);
			play_multi_sound('ball-hit-border');
			//console.log(this.direction);
		}
		else if(this.position.x < this.radius && this.direction < Math.PI*1.5 && this.direction > Math.PI*0.5){
			this.direction = (Math.PI*2+(Math.PI-this.direction))%(Math.PI*2);
			play_multi_sound('ball-hit-border');
			//console.log(this.direction);
		}
	},
	colide: function(height, paddle, bricks, powerups){
		var i, j, newDirection, brickY, brickX;
		if(this.position.y + this.radius > height - paddle.height && this.direction < Math.PI){
			if(this.position.x + this.radius > paddle.position.x-paddle.width/2 && this.position.x - this.radius < paddle.position.x+paddle.width/2){
				//this.direction = Math.PI*2-this.direction;
				this.direction = Math.PI*1.5 + ((this.position.x - paddle.position.x) / (paddle.width/2));
				this.speed.x += this.acceleration;
				this.speed.y += this.acceleration;
				if(bricks.fallingBricks === true){
					bricks.moveBricks();
				}
				play_multi_sound('ball-hit-paddle');
				if(paddle.grabPaddle === true){
					this.stuck = this.position.x - paddle.position.x;
					this.position.y = height-15;
				}
			}
			//console.log(this.direction);
		}
		for(i = 0; i < bricks.bricks.length; i += 1){
			for(j = 0; j < bricks.bricks[i].length; j += 1){
				if(bricks.bricks[i][j] !== 0){
					newDirection = false;
					brickY = (i * (bricks.height + 1)) + 1;
					brickX = (j * (bricks.width + 1)) + 1;
					if((this.position.x + 0.5 > brickX && this.position.x + 0.5 < brickX + bricks.width) || (this.position.x - 0.5 > brickX && this.position.x - 0.5 < brickX + bricks.width)){
						if(this.position.y - this.radius > brickY && this.position.y - this.radius <= brickY + bricks.height && this.direction >= Math.PI){ // touching from below
							newDirection = Math.PI*2-this.direction;
						}
						else if(this.position.y + this.radius >= brickY && this.position.y + this.radius < brickY + bricks.height && this.direction <= Math.PI){ // touching from above
							newDirection = Math.PI*2-this.direction;
						}
					}
					else if((this.position.y + 0.5 > brickY && this.position.y + 0.5 < brickY + bricks.height) || (this.position.y - 0.5 > brickY && this.position.y - 0.5 < brickY + bricks.height)){
						if(this.position.x - this.radius > brickX && this.position.x - this.radius <= brickX + bricks.width && this.direction >= Math.PI*0.5 && this.direction <= Math.PI+1.5){ // touching from left
							newDirection = (Math.PI+(Math.PI*2-this.direction))%(Math.PI*2);
						}
						else if(this.position.x + this.radius >= brickX && this.position.x + this.radius < brickX + bricks.width && (this.direction >= Math.PI*1.5 || this.direction <= Math.PI*0.5)){ // touching from right
							newDirection = (Math.PI*2+(Math.PI-this.direction))%(Math.PI*2);
						}
					}
					if(newDirection !== false){
						if(this.thruBrick === false){
							this.direction = newDirection;
						}
						if(this.fireBall === true){
							bricks.explode(i+1, j, powerups, this.fireBall, this.thruBrick);
							bricks.explode(i+1, j+1, powerups, this.fireBall, this.thruBrick);
							bricks.explode(i+1, j-1, powerups, this.fireBall, this.thruBrick);
							bricks.explode(i-1, j, powerups, this.fireBall, this.thruBrick);
							bricks.explode(i-1, j+1, powerups, this.fireBall, this.thruBrick);
							bricks.explode(i-1, j-1, powerups, this.fireBall, this.thruBrick);
							bricks.explode(i, j+1, powerups, this.fireBall, this.thruBrick);
							bricks.explode(i, j-1, powerups, this.fireBall, this.thruBrick);
						}
						bricks.explode(i, j, powerups, this.fireBall, this.thruBrick);
						play_multi_sound('ball-hit-brick');
					}
				}
			}
		}
	}
};

function Paddle(position,width,height){
	this.position = position || new Vector();
	this.width = width || 128;
	this.height = height || 10;
	this.grabPaddle = false;
	this.shootingPaddle = false;
}
Paddle.prototype = {
	draw: function(ctx){
		ctx.save();
		ctx.beginPath();
		ctx.rect(this.position.x-this.width/2,this.position.y - this.height,this.width,this.height);
		ctx.closePath();
		ctx.fillStyle = '#FFF';
		ctx.fill();
		if(this.shootingPaddle === true && this.grabPaddle === false){
			ctx.beginPath();
			ctx.rect(this.position.x-this.width/2, this.position.y - this.height, 11, this.height);
			ctx.rect(this.position.x+this.width/2 - 11, this.position.y - this.height, 11, this.height);
			ctx.closePath();
			ctx.fillStyle = '#F00';
			ctx.fill();
		}
		else if(this.grabPaddle === true){
			ctx.beginPath();
			ctx.rect(this.position.x-this.width/2, this.position.y - this.height, 11, this.height);
			ctx.rect(this.position.x+this.width/2 - 11, this.position.y - this.height, 11, this.height);
			ctx.closePath();
			ctx.fillStyle = '#0FF';
			ctx.fill();
			if(this.shootingPaddle === true){
				ctx.beginPath();
				ctx.rect(this.position.x-this.width/2 + 3, this.position.y - this.height, 5, this.height);
				ctx.rect(this.position.x+this.width/2 - 8, this.position.y - this.height, 5, this.height);
				ctx.closePath();
				ctx.fillStyle = '#F00';
				ctx.fill();
			}
		}
		ctx.restore();
	},
	moveLeft: function(){
		this.position.x -= 10;
		if(this.position.x < this.width/2){
			this.position.x = this.width/2;
		}
	},
	moveRight: function(width){
		this.position.x += 10;
		if(this.position.x > width - (this.width/2)){
			this.position.x = width - (this.width/2);
		}
	},
	update: function(width){
		if(window.Key.isDown(window.Key.LEFT, window.Key.A)){
			this.moveLeft();
		}
		if(window.Key.isDown(window.Key.RIGHT, window.Key.D)){
			this.moveRight(width);
		}
	}
};

function Shot(position){
	this.position = position || new Vector();
	this.width = 3;
	this.height = 8;
	this.speed = 700;
	this.alive = true;
}
Shot.prototype = {
	draw: function(ctx){
		ctx.save();
		ctx.beginPath();
		ctx.rect(this.position.x, this.position.y, this.width, this.height);
		ctx.closePath();
		ctx.fillStyle = '#F00';
		ctx.fill();
		ctx.restore();
	},
	update: function(bricks, td, powerups){
		this.position.y -= this.speed * td;
		this.stayInArea();
		this.colide(bricks, powerups);
	},
	stayInArea: function(){
		if(this.position.y < 0 - this.height){
			this.alive = false;
		}
	},
	colide: function(bricks, powerups){
		var i, j, brickY, brickX;
		for(i = 0; i < bricks.bricks.length; i += 1){
			for(j = 0; j < bricks.bricks[i].length; j += 1){
				if(bricks.bricks[i][j] !== 0){
					brickY = (i * (bricks.height + 1)) + 1;
					brickX = (j * (bricks.width + 1)) + 1;
					if(this.position.y >= brickY && this.position.y <= brickY + bricks.height){
						if(this.position.x + 3 >= brickX && this.position.x <= brickX + bricks.width){
							bricks.explode(i, j, powerups);
							this.alive = false;
						}
					}
				}
			}
		}
	}
};

function Powerup(position, effect){
	this.position = position || new Vector();
	this.speed = new Vector((Math.random()*400)-200,-150);
	this.acceleration = 4;
	this.width = 60;
	this.height = 30;
	this.effect = effect || this.randomEffect();
	this.alive = true;
	this.grabbed = false;
}
Powerup.prototype = {
	randomEffect: function(){
		var effects = [
			'splitBall',		'splitBall',		'splitBall',		'splitBall',		'splitBall',
			'eightBall',		'eightBall',
			'fastBall',			'fastBall',
			'slowBall',			'slowBall',
			'megaBall',			'megaBall',
			'miniBall',			'miniBall',
			'fireBall',			'fireBall',
			'thruBrick',		'thruBrick',
			'expandPaddle',		'expandPaddle',		'expandPaddle',		'expandPaddle',
			'shrinkPaddle',		'shrinkPaddle',		'shrinkPaddle',
			'miniPaddle',		'miniPaddle',
			'grabPaddle',		'grabPaddle',
			'shootingPaddle',	'shootingPaddle',
			'killPaddle',		'killPaddle',
			'fallingBricks',	'fallingBricks',
			'extraLife'
		];
		
		return effects[Math.floor(Math.random() * effects.length)];
	},
	draw: function(ctx){
		ctx.save();
		ctx.beginPath();
		ctx.rect(this.position.x-this.width/2,this.position.y,this.width,this.height);
		ctx.closePath();

		switch(this.effect){
			case 'splitBall':
				ctx.fillStyle = '#808080';
				ctx.fill();

				ctx.fillStyle = "#FFF";
				ctx.beginPath();
				ctx.arc(this.position.x,this.position.y + 7,4,0,Math.PI*2,true);
				ctx.closePath();
				ctx.fill();
				ctx.beginPath();
				ctx.arc(this.position.x + 10,this.position.y + 23,4,0,Math.PI*2,true);
				ctx.closePath();
				ctx.fill();
				ctx.beginPath();
				ctx.arc(this.position.x - 10,this.position.y + 23,4,0,Math.PI*2,true);
				ctx.closePath();
				ctx.fill();

				ctx.beginPath();
				ctx.moveTo(this.position.x - 4, this.position.y + 10);
				ctx.lineTo(this.position.x - 2, this.position.y + 12);
				ctx.lineTo(this.position.x - 4, this.position.y + 15);
				ctx.lineTo(this.position.x - 1, this.position.y + 17);
				ctx.lineTo(this.position.x - 8, this.position.y + 18);
				ctx.lineTo(this.position.x - 10, this.position.y + 12);
				ctx.lineTo(this.position.x - 6, this.position.y + 13);

				ctx.moveTo(this.position.x + 4, this.position.y + 10);
				ctx.lineTo(this.position.x + 2, this.position.y + 12);
				ctx.lineTo(this.position.x + 4, this.position.y + 15);
				ctx.lineTo(this.position.x + 1, this.position.y + 17);
				ctx.lineTo(this.position.x + 8, this.position.y + 18);
				ctx.lineTo(this.position.x + 10, this.position.y + 12);
				ctx.lineTo(this.position.x + 6, this.position.y + 13);
				ctx.closePath();
				ctx.fillStyle = "#0F0";
				break;
			case 'eightBall':
				ctx.fillStyle = '#808080';
				ctx.fill();

				ctx.beginPath();
				ctx.arc(this.position.x, this.position.y + 15, 3, 0, Math.PI*2, true);
				ctx.closePath();
				ctx.fillStyle = "#0F0";
				ctx.fill();

				ctx.fillStyle = "#FFF";
				ctx.beginPath();
				ctx.arc(this.position.x, this.position.y + 25, 3, 0, Math.PI*2, true);
				ctx.closePath();
				ctx.fill();
				ctx.beginPath();
				ctx.arc(this.position.x, this.position.y + 5, 3, 0, Math.PI*2, true);
				ctx.closePath();
				ctx.fill();
				ctx.beginPath();
				ctx.arc(this.position.x + 10, this.position.y + 15, 3, 0, Math.PI*2, true);
				ctx.closePath();
				ctx.fill();
				ctx.beginPath();
				ctx.arc(this.position.x - 10, this.position.y + 15, 3, 0, Math.PI*2, true);
				ctx.closePath();
				ctx.fill();
				ctx.beginPath();
				ctx.arc(this.position.x + 7, this.position.y + 22, 3, 0, Math.PI*2, true);
				ctx.closePath();
				ctx.fill();
				ctx.beginPath();
				ctx.arc(this.position.x + 7, this.position.y + 8, 3, 0, Math.PI*2, true);
				ctx.closePath();
				ctx.fill();
				ctx.beginPath();
				ctx.arc(this.position.x - 7, this.position.y + 22, 3, 0, Math.PI*2, true);
				ctx.closePath();
				ctx.fill();
				ctx.beginPath();
				ctx.arc(this.position.x - 7, this.position.y + 8, 3, 0, Math.PI*2, true);
				ctx.closePath();
				break;
			case 'fastBall':
				ctx.fillStyle = '#F00';
				ctx.fill();

				ctx.beginPath();
				ctx.moveTo(this.position.x - 4, this.position.y + 15);
				ctx.lineTo(this.position.x - 15, this.position.y + 5);
				ctx.lineTo(this.position.x - 18, this.position.y + 7);
				ctx.lineTo(this.position.x - 9, this.position.y + 15);
				ctx.lineTo(this.position.x - 18, this.position.y + 23);
				ctx.lineTo(this.position.x - 15, this.position.y + 25);

				ctx.moveTo(this.position.x - 4 + 11, this.position.y + 15);
				ctx.lineTo(this.position.x - 15 + 11, this.position.y + 5);
				ctx.lineTo(this.position.x - 18 + 11, this.position.y + 7);
				ctx.lineTo(this.position.x - 9 + 11, this.position.y + 15);
				ctx.lineTo(this.position.x - 18 + 11, this.position.y + 23);
				ctx.lineTo(this.position.x - 15 + 11, this.position.y + 25);

				ctx.moveTo(this.position.x - 4 + 22, this.position.y + 15);
				ctx.lineTo(this.position.x - 15 + 22, this.position.y + 5);
				ctx.lineTo(this.position.x - 18 + 22, this.position.y + 7);
				ctx.lineTo(this.position.x - 9 + 22, this.position.y + 15);
				ctx.lineTo(this.position.x - 18 + 22, this.position.y + 23);
				ctx.lineTo(this.position.x - 15 + 22, this.position.y + 25);
				ctx.closePath();
				ctx.fillStyle = "FF0";
				break;
			case 'slowBall':
				ctx.fillStyle = '#00F';
				ctx.fill();

				ctx.strokeStyle = '#FFF';
				ctx.beginPath();
				ctx.arc(this.position.x + 10, this.position.y + 20, 6, Math.PI, Math.PI * 1.35, false);
				ctx.moveTo(0,0);
				ctx.closePath();
				ctx.stroke();
				ctx.beginPath();
				ctx.arc(this.position.x + 10, this.position.y + 20, 9, Math.PI, Math.PI * 1.35, false);
				ctx.moveTo(0,0);
				ctx.closePath();
				ctx.stroke();
				ctx.beginPath();
				ctx.arc(this.position.x + 10, this.position.y + 20, 12, Math.PI, Math.PI * 1.35, false);
				ctx.moveTo(0,0);
				ctx.closePath();
				ctx.stroke();
				ctx.beginPath();
				ctx.arc(this.position.x + 10, this.position.y + 20, 15, Math.PI, Math.PI * 1.35, false);
				ctx.moveTo(0,0);
				ctx.closePath();
				ctx.stroke();
				ctx.beginPath();
				ctx.arc(this.position.x + 10, this.position.y + 20, 18, Math.PI, Math.PI * 1.35, false);
				ctx.moveTo(0,0);
				ctx.closePath();
				ctx.stroke();

				ctx.beginPath();
				ctx.arc(this.position.x + 10, this.position.y + 20, 3, 0, Math.PI*2, true);
				ctx.closePath();
				ctx.fillStyle = '#FFF';
				break;
			case 'megaBall':
				ctx.fillStyle = '#808080';
				ctx.fill();

				ctx.beginPath();
				ctx.arc(this.position.x, this.position.y + 15, 10, 0, Math.PI*2, true);
				ctx.closePath();
				ctx.fillStyle = "#FFF";
				break;
			case 'miniBall':
				ctx.fillStyle = '#F00';
				ctx.fill();

				ctx.beginPath();
				ctx.arc(this.position.x, this.position.y + 15, 2.5, 0, Math.PI*2, true);
				ctx.closePath();
				ctx.fillStyle = "#FFF";
				break;
			case 'fireBall':
				ctx.fillStyle = '#00F';
				ctx.fill();

				ctx.beginPath();
				ctx.arc(this.position.x -2, this.position.y +18, 7, Math.PI/6, Math.PI*1.3, false);
				ctx.lineTo(this.position.x+1, this.position.y+9);
				ctx.lineTo(this.position.x+1, this.position.y + 12);
				ctx.lineTo(this.position.x+4, this.position.y + 12);
				ctx.lineTo(this.position.x+4, this.position.y + 15);
				ctx.lineTo(this.position.x+7, this.position.y + 15);
				ctx.closePath();
				ctx.fillStyle = "#F70";
				ctx.fill();

				ctx.beginPath();
				ctx.moveTo(this.position.x+1, this.position.y+9);
				ctx.lineTo(this.position.x+1, this.position.y + 12);
				ctx.lineTo(this.position.x+4, this.position.y + 12);
				ctx.lineTo(this.position.x+4, this.position.y + 15);
				ctx.lineTo(this.position.x+7, this.position.y + 15);
				ctx.lineTo(this.position.x + 10, this.position.y + 8);
				ctx.lineTo(this.position.x + 6, this.position.y + 10);
				ctx.lineTo(this.position.x + 8, this.position.y + 6);

				ctx.closePath();
				ctx.fillStyle = '#F00';
				ctx.fill();

				ctx.beginPath();
				ctx.arc(this.position.x - 2, this.position.y + 18, 4, 0, Math.PI*2, true);
				ctx.closePath();
				ctx.fillStyle = "#FF0";
				break;
			case 'thruBrick':
				ctx.fillStyle = '#00F';
				ctx.fill();

				ctx.beginPath();
				ctx.rect(this.position.x-12, this.position.y+12, 24, 6);
				ctx.closePath();
				ctx.fillStyle = '#FFA500';
				ctx.fill();

				ctx.beginPath();
				ctx.arc(this.position.x - 8, this.position.y + 23.5, 2.5, 0, Math.PI*2, true);
				ctx.closePath();
				ctx.fillStyle = '#FFF';
				ctx.fill();

				ctx.beginPath();
				ctx.moveTo(this.position.x - 8, this.position.y + 20);
				ctx.lineTo(this.position.x - 4, this.position.y + 21);
				ctx.lineTo(this.position.x + 8, this.position.y + 10);
				ctx.lineTo(this.position.x + 10, this.position.y + 12);
				ctx.lineTo(this.position.x + 12, this.position.y + 4);
				ctx.lineTo(this.position.x + 2, this.position.y + 6);
				ctx.lineTo(this.position.x + 5, this.position.y + 8);
				ctx.closePath();
				ctx.fillStyle = '#808080';
				break;
			case 'expandPaddle':
				ctx.fillStyle = '#808080';
				ctx.fill();

				ctx.beginPath();
				ctx.moveTo(this.position.x - 20, this.position.y + this.height/2);
				ctx.lineTo(this.position.x - 13, this.position.y + this.height/2 - 7);
				ctx.lineTo(this.position.x - 13, this.position.y + this.height/2 - 3);
				ctx.lineTo(this.position.x - 6, this.position.y + this.height/2 - 3);
				ctx.lineTo(this.position.x - 6, this.position.y + this.height/2 + 3);
				ctx.lineTo(this.position.x - 13, this.position.y + this.height/2 + 3);
				ctx.lineTo(this.position.x - 13, this.position.y + this.height/2 + 7);

				ctx.moveTo(this.position.x + 20, this.position.y + this.height/2);
				ctx.lineTo(this.position.x + 13, this.position.y + this.height/2 - 7);
				ctx.lineTo(this.position.x + 13, this.position.y + this.height/2 - 3);
				ctx.lineTo(this.position.x + 6, this.position.y + this.height/2 - 3);
				ctx.lineTo(this.position.x + 6, this.position.y + this.height/2 + 3);
				ctx.lineTo(this.position.x + 13, this.position.y + this.height/2 + 3);
				ctx.lineTo(this.position.x + 13, this.position.y + this.height/2 + 7);
				ctx.closePath();
				ctx.fillStyle = '#00F';
				break;
			case 'shrinkPaddle':
				ctx.fillStyle = '#808080';
				ctx.fill();

				ctx.beginPath();
				ctx.moveTo(this.position.x - 6, this.position.y + this.height/2);
				ctx.lineTo(this.position.x - 13, this.position.y + this.height/2 - 7);
				ctx.lineTo(this.position.x - 13, this.position.y + this.height/2 - 3);
				ctx.lineTo(this.position.x - 20, this.position.y + this.height/2 - 3);
				ctx.lineTo(this.position.x - 20, this.position.y + this.height/2 + 3);
				ctx.lineTo(this.position.x - 13, this.position.y + this.height/2 + 3);
				ctx.lineTo(this.position.x - 13, this.position.y + this.height/2 + 7);

				ctx.moveTo(this.position.x + 6, this.position.y + this.height/2);
				ctx.lineTo(this.position.x + 13, this.position.y + this.height/2 - 7);
				ctx.lineTo(this.position.x + 13, this.position.y + this.height/2 - 3);
				ctx.lineTo(this.position.x + 20, this.position.y + this.height/2 - 3);
				ctx.lineTo(this.position.x + 20, this.position.y + this.height/2 + 3);
				ctx.lineTo(this.position.x + 13, this.position.y + this.height/2 + 3);
				ctx.lineTo(this.position.x + 13, this.position.y + this.height/2 + 7);

				ctx.closePath();
				ctx.fillStyle = '#F00';
				break;
			case 'miniPaddle':
				ctx.fillStyle = '#F00';
				ctx.fill();

				ctx.beginPath();
				ctx.rect(this.position.x - 12,this.position.y + 10, 24, 10);
				ctx.closePath();
				ctx.fillStyle = '#FFF';
				break;
			case 'grabPaddle':
				ctx.fillStyle = '#00F';
				ctx.fill();

				ctx.beginPath();
				ctx.rect(this.position.x - 15, this.position.y + 16, 30, 5);
				ctx.closePath();
				ctx.fillStyle = '#FFF';
				ctx.fill();

				ctx.beginPath();
				ctx.rect(this.position.x - 15, this.position.y + 10, 3, 6);
				ctx.rect(this.position.x + 12, this.position.y + 10, 3, 6);
				ctx.closePath();
				ctx.fillStyle = '#14C4AD';
				ctx.fill();

				ctx.beginPath();
				ctx.rect(this.position.x - 12, this.position.y + 10, 24, 1);
				ctx.closePath();
				ctx.fillStyle = '#F00';
				break;
			case 'shootingPaddle':
				ctx.fillStyle = '#00F';
				ctx.fill();

				ctx.beginPath();
				ctx.rect(this.position.x - 12, this.position.y + 18, 24, 6);
				ctx.closePath();
				ctx.fillStyle = '#FFF';
				ctx.fill();

				ctx.beginPath();
				ctx.rect(this.position.x - 12, this.position.y + 11, 2, 4);
				ctx.rect(this.position.x - 12, this.position.y + 4, 2, 4);
				ctx.rect(this.position.x + 10, this.position.y + 11, 2, 4);
				ctx.rect(this.position.x + 10, this.position.y + 4, 2, 4);
				ctx.closePath();
				ctx.fillStyle = '#F00';

				break;
			case 'killPaddle':
				ctx.fillStyle = '#F00';
				ctx.fill();

				ctx.beginPath();
				ctx.moveTo(this.position.x - 2, this.position.y + 5);
				ctx.lineTo(this.position.x + 2, this.position.y + 5);
				ctx.lineTo(this.position.x + 5, this.position.y + 6);
				ctx.lineTo(this.position.x + 7, this.position.y + 9);
				ctx.lineTo(this.position.x + 6, this.position.y + 10);
				ctx.lineTo(this.position.x + 6, this.position.y + 12);
				ctx.lineTo(this.position.x + 5, this.position.y + 13);
				ctx.lineTo(this.position.x + 4, this.position.y + 16);
				ctx.lineTo(this.position.x + 1, this.position.y + 17);
				ctx.lineTo(this.position.x, this.position.y + 17);
				ctx.lineTo(this.position.x - 1, this.position.y + 17);
				ctx.lineTo(this.position.x - 4, this.position.y + 16);
				ctx.lineTo(this.position.x - 5, this.position.y + 13);
				ctx.lineTo(this.position.x - 6, this.position.y + 12);
				ctx.lineTo(this.position.x - 6, this.position.y + 10);
				ctx.lineTo(this.position.x - 7, this.position.y + 9);
				ctx.lineTo(this.position.x - 5, this.position.y + 6);

				ctx.moveTo(this.position.x - 10, this.position.y + 18);
				ctx.lineTo(this.position.x, this.position.y + 21);
				ctx.lineTo(this.position.x + 10, this.position.y + 18);
				ctx.lineTo(this.position.x + 12, this.position.y + 20);
				ctx.lineTo(this.position.x + 3, this.position.y + 22);
				ctx.lineTo(this.position.x + 12, this.position.y + 24);
				ctx.lineTo(this.position.x + 10, this.position.y + 26);
				ctx.lineTo(this.position.x, this.position.y + 23);
				ctx.lineTo(this.position.x - 10, this.position.y + 26);
				ctx.lineTo(this.position.x - 12, this.position.y + 24);
				ctx.lineTo(this.position.x - 3, this.position.y + 22);
				ctx.lineTo(this.position.x - 12, this.position.y + 20);

				ctx.closePath();
				ctx.fillStyle = '#FFF';
				ctx.fill();

				ctx.beginPath();
				ctx.arc(this.position.x - 3, this.position.y + 11, 1.5, 0, Math.PI*2, true);
				ctx.arc(this.position.x + 3, this.position.y + 11, 1.5, 0, Math.PI*2, true);
				ctx.rect(this.position.x - 2, this.position.y + 14, 4, 1);
				ctx.closePath();
				ctx.fillStyle = '#000';
				break;
			case 'fallingBricks':
				ctx.fillStyle = '#F00';
				ctx.fill();

				ctx.beginPath();
				ctx.rect(this.position.x - 17,this.position.y + 4, 34, 10);
				ctx.closePath();
				ctx.fillStyle = '#5F1978';
				ctx.fill();

				ctx.beginPath();
				ctx.moveTo(this.position.x - 2, this.position.y + 16);
				ctx.lineTo(this.position.x + 2, this.position.y + 16);
				ctx.lineTo(this.position.x + 2, this.position.y + 20);
				ctx.lineTo(this.position.x + 6, this.position.y + 20);
				ctx.lineTo(this.position.x, this.position.y + 26);
				ctx.lineTo(this.position.x -6, this.position.y + 20);
				ctx.lineTo(this.position.x - 2, this.position.y + 20);

				ctx.closePath();
				ctx.fillStyle = '#FF0';
				break;
			case 'extraLife':
				ctx.fillStyle = '#00F';
				ctx.fill();

				ctx.beginPath();
				ctx.font = 'italic bold 25px sans-serif';
				ctx.textBaseline = 'bottom';
				ctx.fillStyle = '#FFF';
				ctx.fillText('+1', this.position.x - 17, this.position.y + 30);
				break;
			default:
				ctx.fillStyle = '#FFF';
		}

		ctx.fill();
		ctx.restore();
	},
	update: function(paddle, td, width, height){
		this.position.x += this.speed.x * td;
		this.position.y += this.speed.y * td;
		if(this.speed.y < 300){
			this.speed.y += this.acceleration;
		}
		this.stayInArea(width, height);
		this.colide(height, paddle);
	},
	stayInArea: function(width, height){
		if(this.position.y > height + this.height){
			this.alive = false;
		}
		else if(this.position.x + this.width/2 > width && this.speed.x > 0){
			this.speed.x = - this.speed.x;
		}
		else if(this.position.x - this.width/2 < 0 && this.speed.x < 0){
			this.speed.x = - this.speed.x;
		}
	},
	colide: function(height, paddle){
		if(this.position.y + this.height > height - paddle.height){
			if(this.position.x + this.width/2 > paddle.position.x - paddle.width/2 && this.position.x - this.width/2 < paddle.position.x + paddle.width/2){
				this.grabbed = true;
			}
		}
	}
};

function Bricks(bricks){
	var i, j;
	this.width = 50.5; // (canvas.width - (cols + 1)) / cols
	this.height = 15;
	this.nrOfBricks = 0;
	this.fallingBricks = false;
	this.bricks = bricks || [];
	for(i = 0; i < this.bricks.length; i += 1){
		for(j = 0; j < this.bricks[i].length; j += 1){
			if(this.bricks[i][j] !== 0 && this.bricks[i][j] !== 20){
				this.nrOfBricks += 1;
			}
		}
	}
}
Bricks.prototype = {
	draw: function(ctx){
		var i, j;
		ctx.save();
		ctx.fillStyle = '#FFF';
		for(i = 0; i < this.bricks.length; i += 1){
			for(j = 0; j < this.bricks[i].length; j += 1){
				if(this.bricks[i][j] !== 0){
					ctx.beginPath();
					switch(this.bricks[i][j]){
						case 1:
							ctx.fillStyle = 'rgb(40,201,51)';
							break;
						case 2:
							ctx.fillStyle = 'rgb(0,115,201)';
							break;
						case 3:
							ctx.fillStyle = '#7D1B7E';
							break;
						case 4:
							ctx.fillStyle = 'rgb(200,00,0)';
							break;
						case 5:
							ctx.fillStyle = '#FFE87C';
							break;
						case 6:
							ctx.fillStyle = '#48CCCD';
							break;
						case 7:
							ctx.fillStyle = '#222';
							break;
						case 8:
							ctx.fillStyle = '#666';
							break;
						case 9:
							ctx.fillStyle = '#AAA';
							break;
						case 10:
							ctx.fillStyle = '#CA226B';
							break;
						case 11:
							ctx.fillStyle = '#000';
							break;
						case 12:
							ctx.fillStyle = '#E56717';
							break;
						case 13:
							ctx.fillStyle = '#FFF8C6';
							break;
						case 14:
							ctx.fillStyle = '#A0C544';
							break;
						case 15:
							ctx.fillStyle = '#254117';
							break;
						case 16:
							ctx.fillStyle = '#4E8975';
							break;
						case 17:
							ctx.fillStyle = '#C25A7C';
							break;
						case 18:
							ctx.fillStyle = '#571B7E';
							break;
						case 19:
							ctx.fillStyle = '#800517';
							break;
						case 20:
							ctx.fillStyle = '#FFFC17';
							break;
						case 21:
							ctx.fillStyle = '#2554C7';
							break;
						case 22:
							ctx.fillStyle = '#804000';
							break;
						case 23:
							ctx.fillStyle = '#F4A460';
							break;
						case 24:
							ctx.fillStyle = '#E60000';
							break;
						case 25:
							ctx.fillStyle = '#F00';
							break;
						case 26:
							ctx.fillStyle = '#FF5050';
							break;
						case 27:
							ctx.fillStyle = '#FFD2D2';
							break;
						case 28:
							ctx.fillStyle = '#FFDC00';
							break;
						case 98:
							ctx.fillStyle = '#411257';
							break;
						default:
							ctx.fillStyle = '#FFF';
							break;
					}
					ctx.rect((j * (this.width + 1) + 1), (i * (this.height + 1) + 1), this.width, this.height);
					ctx.fill();
				}
			}
		}
		ctx.restore();
	},
	moveBricks: function(){
		var i, j;
		for(i = this.bricks.length - 1; i > 0; i -= 1){
			for(j = 0; j < this.bricks[i].length; j += 1){
				if(this.bricks[i-1][j] !== 0 && this.bricks[i][j] === 0){
					this.bricks[i][j] = this.bricks[i-1][j];
					this.bricks[i-1][j] = 0;
				}
			}
		}
	},
	explode: function(i, j, powerups, fireBall, thruBrick){
		if(i >= 0 && i < 30 && j >= 0 && j < 18 && this.bricks[i][j] !== 0){
			switch(this.bricks[i][j]){
				case 9:
					if(fireBall === true || thruBrick === true){
						this.bricks[i][j] = 0;
						this.nrOfBricks -= 1;
						if(Math.random()>0.9){
							powerups.push(new Powerup(new Vector(j* (this.width + 1) + this.width/2, i * (this.height + 1) + 1 + this.height/2)));
						}
					}
					else{
						this.bricks[i][j] = 8;
					}
					break;
				case 8:
					if(fireBall === true || thruBrick === true){
						this.bricks[i][j] = 0;
						this.nrOfBricks -= 1;
						if(Math.random()>0.9){
							powerups.push(new Powerup(new Vector(j* (this.width + 1) + this.width/2, i * (this.height + 1) + 1 + this.height/2)));
						}
					}
					else{
						this.bricks[i][j] = 7;
					}
					break;
				case 11:
					if(fireBall === true || thruBrick === true){
						this.bricks[i][j] = 0;
						this.nrOfBricks -= 1;
						if(Math.random()>0.9){
							powerups.push(new Powerup(new Vector(j* (this.width + 1) + this.width/2, i * (this.height + 1) + 1 + this.height/2)));
						}
					}
					else{
						this.bricks[i][j] = 10;
					}
					break;
				case 20:
					if(fireBall === true || thruBrick === true){
						this.bricks[i][j] = 0;
						if(Math.random()>0.9){
							powerups.push(new Powerup(new Vector(j* (this.width + 1) + this.width/2, i * (this.height + 1) + 1 + this.height/2)));
						}
					}
					break;
				case 98:
					this.bricks[i][j] = 0;
					break;
				default:
					this.bricks[i][j] = 0;
					this.nrOfBricks -= 1;
					if(Math.random()>0.9){
						powerups.push(new Powerup(new Vector(j* (this.width + 1) + this.width/2, i * (this.height + 1) + 1 + this.height/2)));
					}
					break;
			}
		}
	}
};

window.Breakout = (function(){
	var ctx, width, height, player, now, td, request, lastGameTick, pause, lives, levels, levelAt, balls, paddle, bricks, powerups, shots, shootingPaddle, thruBrick, startScreen, startScreenPowerups,
	init = function(canvas){
		canvas = document.getElementById(canvas);
		ctx = canvas.getContext('2d');
		width = canvas.width;
		height = canvas.height;
		initGame();
		startScreen = true;
		pause = 0;
		startScreenPowerups = [
			new Powerup(new Vector(300, 490), 'extraLife'),
			new Powerup(new Vector(400, 250), 'fireBall'),
			new Powerup(new Vector(400, 310), 'thruBrick'),
			new Powerup(new Vector(400, 370), 'shootingPaddle'),
			new Powerup(new Vector(400, 430), 'grabPaddle'),
			new Powerup(new Vector(400, 490), 'slowBall'),
			new Powerup(new Vector(500, 250), 'killPaddle'),
			new Powerup(new Vector(500, 310), 'miniBall'),
			new Powerup(new Vector(500, 370), 'fastBall'),
			new Powerup(new Vector(500, 430), 'miniPaddle'),
			new Powerup(new Vector(500, 490), 'fallingBricks'),
			new Powerup(new Vector(600, 250), 'expandPaddle'),
			new Powerup(new Vector(600, 310), 'shrinkPaddle'),
			new Powerup(new Vector(600, 370), 'splitBall'),
			new Powerup(new Vector(600, 430), 'eightBall'),
			new Powerup(new Vector(600, 490), 'megaBall')
		];
		render();
	},
	initGame = function(){
		lives = 2;
		levelAt = 0;
		levels = [
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 01, 01, 01, 01, 01, 01, 01, 01, 01, 01, 01, 01, 01, 01, 01, 01, 00],
				[00, 01, 02, 02, 02, 02, 02, 02, 02, 02, 02, 02, 02, 02, 02, 02, 01, 00],
				[00, 01, 02, 03, 03, 03, 03, 03, 03, 03, 03, 03, 03, 03, 03, 02, 01, 00],
				[00, 01, 02, 03, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 03, 02, 01, 00],
				[00, 01, 02, 03, 04, 05, 05, 05, 05, 05, 05, 05, 05, 04, 03, 02, 01, 00],
				[00, 01, 02, 03, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 03, 02, 01, 00],
				[00, 01, 02, 03, 03, 03, 03, 03, 03, 03, 03, 03, 03, 03, 03, 02, 01, 00],
				[00, 01, 02, 02, 02, 02, 02, 02, 02, 02, 02, 02, 02, 02, 02, 02, 01, 00],
				[00, 01, 01, 01, 01, 01, 01, 01, 01, 01, 01, 01, 01, 01, 01, 01, 01, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 05, 05, 05, 05, 05, 05, 05, 05, 05, 05, 05, 05, 05, 05, 05, 05, 00],
				[00, 05, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 05, 00],
				[00, 05, 00, 01, 00, 01, 00, 01, 00, 00, 01, 00, 01, 00, 01, 00, 05, 00],
				[00, 05, 00, 01, 00, 01, 00, 01, 00, 00, 01, 00, 01, 00, 01, 00, 05, 00],
				[00, 05, 00, 01, 00, 01, 00, 01, 00, 00, 01, 00, 01, 00, 01, 00, 05, 00],
				[00, 05, 00, 01, 00, 01, 00, 01, 00, 00, 01, 00, 01, 00, 01, 00, 05, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 05, 00, 01, 00, 01, 00, 01, 00, 00, 01, 00, 01, 00, 01, 00, 05, 00],
				[00, 05, 00, 01, 00, 01, 00, 01, 00, 00, 01, 00, 01, 00, 01, 00, 05, 00],
				[00, 05, 00, 01, 00, 01, 00, 01, 00, 00, 01, 00, 01, 00, 01, 00, 05, 00],
				[00, 05, 00, 01, 00, 01, 00, 01, 00, 00, 01, 00, 01, 00, 01, 00, 05, 00],
				[00, 05, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 05, 00],
				[00, 05, 05, 05, 05, 05, 05, 05, 05, 05, 05, 05, 05, 05, 05, 05, 05, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 04, 00, 03, 00, 01, 00, 02, 00, 00, 02, 00, 01, 00, 03, 00, 04, 00],
				[00, 00, 04, 00, 03, 00, 01, 00, 02, 02, 00, 01, 00, 03, 00, 04, 00, 00],
				[00, 03, 00, 04, 00, 03, 00, 01, 00, 00, 01, 00, 03, 00, 04, 00, 03, 00],
				[00, 00, 03, 00, 04, 00, 03, 00, 01, 01, 00, 03, 00, 04, 00, 03, 00, 00],
				[00, 01, 00, 03, 00, 04, 00, 03, 00, 00, 03, 00, 04, 00, 03, 00, 01, 00],
				[00, 00, 01, 00, 03, 00, 04, 00, 03, 03, 00, 04, 00, 03, 00, 01, 00, 00],
				[00, 02, 00, 01, 00, 03, 00, 04, 00, 00, 04, 00, 03, 00, 01, 00, 02, 00],
				[00, 00, 02, 00, 01, 00, 03, 00, 04, 04, 00, 03, 00, 01, 00, 02, 00, 00],
				[00, 00, 02, 00, 01, 00, 03, 00, 04, 04, 00, 03, 00, 01, 00, 02, 00, 00],
				[00, 02, 00, 01, 00, 03, 00, 04, 00, 00, 04, 00, 03, 00, 01, 00, 02, 00],
				[00, 00, 01, 00, 03, 00, 04, 00, 03, 03, 00, 04, 00, 03, 00, 01, 00, 00],
				[00, 01, 00, 03, 00, 04, 00, 03, 00, 00, 03, 00, 04, 00, 03, 00, 01, 00],
				[00, 00, 03, 00, 04, 00, 03, 00, 01, 01, 00, 03, 00, 04, 00, 03, 00, 00],
				[00, 03, 00, 04, 00, 03, 00, 01, 00, 00, 01, 00, 03, 00, 04, 00, 03, 00],
				[00, 00, 04, 00, 03, 00, 01, 00, 02, 02, 00, 01, 00, 03, 00, 04, 00, 00],
				[00, 04, 00, 03, 00, 01, 00, 02, 00, 00, 02, 00, 01, 00, 03, 00, 04, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 21, 00, 00, 21, 21, 00, 00, 00, 00, 00, 00, 04],
				[00, 00, 00, 00, 00, 00, 00, 21, 21, 00, 00, 21, 00, 00, 00, 00, 04, 00],
				[00, 00, 00, 00, 00, 00, 00, 21, 00, 00, 00, 00, 04, 00, 00, 04, 04, 00],
				[00, 00, 00, 00, 00, 00, 21, 00, 00, 00, 00, 00, 00, 04, 04, 00, 00, 04],
				[00, 00, 21, 00, 00, 21, 21, 00, 00, 00, 00, 00, 00, 04, 00, 00, 00, 00],
				[00, 00, 00, 21, 21, 00, 00, 21, 00, 00, 00, 00, 04, 00, 00, 00, 00, 00],
				[00, 00, 00, 21, 00, 00, 00, 00, 04, 00, 00, 04, 04, 00, 00, 00, 00, 00],
				[00, 00, 21, 00, 00, 00, 00, 00, 00, 04, 04, 00, 00, 04, 00, 00, 00, 00],
				[00, 21, 21, 00, 00, 00, 00, 00, 00, 04, 00, 00, 00, 00, 01, 00, 00, 01],
				[21, 00, 00, 21, 00, 00, 00, 00, 04, 00, 00, 00, 00, 00, 00, 01, 01, 00],
				[00, 00, 00, 00, 04, 00, 00, 04, 04, 00, 00, 00, 00, 00, 00, 01, 00, 00],
				[00, 00, 00, 00, 00, 04, 04, 00, 00, 04, 00, 00, 00, 00, 01, 00, 00, 00],
				[00, 00, 00, 00, 00, 04, 00, 00, 00, 00, 01, 00, 00, 01, 01, 00, 00, 00],
				[00, 00, 00, 00, 04, 00, 00, 00, 00, 00, 00, 01, 01, 00, 00, 01, 00, 00],
				[04, 00, 00, 04, 04, 00, 00, 00, 00, 00, 00, 01, 00, 00, 00, 00, 03, 00],
				[00, 04, 04, 00, 00, 04, 00, 00, 00, 00, 01, 00, 00, 00, 00, 00, 00, 03],
				[00, 04, 00, 00, 00, 00, 01, 00, 00, 01, 01, 00, 00, 00, 00, 00, 00, 03],
				[04, 00, 00, 00, 00, 00, 00, 01, 01, 00, 00, 01, 00, 00, 00, 00, 03, 00],
				[04, 00, 00, 00, 00, 00, 00, 01, 00, 00, 00, 00, 03, 00, 00, 03, 03, 00],
				[00, 04, 00, 00, 00, 00, 01, 00, 00, 00, 00, 00, 00, 03, 03, 00, 00, 03],
				[00, 00, 01, 00, 00, 01, 01, 00, 00, 00, 00, 00, 00, 03, 00, 00, 00, 00],
				[00, 00, 00, 01, 01, 00, 00, 01, 00, 00, 00, 00, 03, 00, 00, 00, 00, 00],
				[00, 00, 00, 01, 00, 00, 00, 00, 03, 00, 00, 03, 03, 00, 00, 00, 00, 00],
				[00, 00, 01, 00, 00, 00, 00, 00, 00, 03, 03, 00, 00, 03, 00, 00, 00, 00],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 12, 12, 12, 12, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 12, 12, 12, 12, 12, 12, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 12, 12, 12, 12, 12, 12, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 12, 12, 12, 12, 12, 12, 12, 12, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 12, 12, 12, 12, 12, 12, 12, 12, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 00, 00, 00, 00],
				[00, 00, 00, 00, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 00, 00, 00, 00],
				[00, 00, 00, 12, 07, 07, 12, 12, 12, 12, 12, 12, 07, 07, 12, 00, 00, 00],
				[00, 00, 00, 12, 12, 13, 07, 12, 12, 12, 12, 07, 13, 12, 12, 00, 00, 00],
				[00, 00, 12, 12, 12, 13, 07, 07, 07, 07, 07, 07, 13, 12, 12, 12, 00, 00],
				[00, 00, 12, 12, 12, 13, 07, 13, 12, 12, 13, 07, 13, 12, 12, 12, 00, 00],
				[00, 12, 12, 12, 12, 13, 07, 13, 12, 12, 13, 07, 13, 12, 12, 12, 12, 00],
				[00, 12, 12, 12, 12, 13, 07, 13, 12, 12, 13, 07, 13, 12, 12, 12, 12, 00],
				[00, 12, 12, 12, 12, 13, 13, 13, 12, 12, 13, 13, 13, 12, 12, 12, 12, 00],
				[00, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 00],
				[00, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 00],
				[00, 00, 12, 12, 12, 12, 13, 13, 13, 13, 13, 13, 12, 12, 12, 12, 00, 00],
				[00, 00, 00, 00, 00, 13, 13, 13, 13, 13, 13, 13, 13, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 13, 13, 13, 13, 13, 13, 13, 13, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 13, 13, 13, 13, 13, 13, 13, 13, 07, 07, 00, 00, 00],
				[00, 00, 00, 00, 07, 07, 13, 13, 13, 13, 13, 07, 07, 07, 07, 07, 00, 00],
				[00, 00, 00, 00, 07, 07, 13, 13, 13, 13, 13, 07, 07, 07, 07, 07, 00, 00],
				[00, 00, 00, 00, 07, 07, 07, 13, 13, 13, 07, 07, 07, 07, 07, 07, 00, 00],
				[00, 00, 00, 00, 00, 07, 07, 07, 13, 00, 07, 07, 07, 07, 07, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 21, 21, 21, 21, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00],
				[00, 00, 21, 21, 09, 21, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 00, 00],
				[00, 00, 21, 09, 21, 21, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00],
				[00, 00, 21, 21, 09, 21, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 00, 00],
				[00, 00, 21, 09, 21, 21, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00],
				[00, 00, 21, 21, 09, 21, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 00, 00],
				[00, 00, 21, 21, 21, 21, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00],
				[00, 00, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 00, 00],
				[00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00],
				[00, 00, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 00, 00],
				[00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00],
				[00, 00, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 00, 00],
				[00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00],
				[00, 00, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 00, 00],
				[00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00],
				[00, 00, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 09, 00, 00],
				[00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 03, 03, 03, 03, 03, 03, 03, 03, 03, 03, 03, 03, 03, 03, 00, 00],
				[00, 20, 20, 20, 20, 20, 20, 20, 00, 00, 20, 20, 20, 20, 20, 20, 20, 00],
				[00, 00, 02, 02, 02, 02, 02, 02, 02, 02, 02, 02, 02, 02, 02, 02, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[02, 02, 02, 02, 02, 02, 02, 00, 00, 00, 00, 02, 02, 02, 02, 02, 02, 02],
				[00, 20, 20, 20, 20, 20, 20, 20, 00, 00, 20, 20, 20, 20, 20, 20, 20, 00],
				[06, 06, 06, 06, 06, 06, 06, 00, 00, 00, 00, 06, 06, 06, 06, 06, 06, 06],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 06, 06, 06, 06, 06, 06, 06, 06, 06, 06, 06, 06, 06, 06, 00, 00],
				[00, 20, 20, 20, 20, 20, 20, 20, 00, 00, 20, 20, 20, 20, 20, 20, 20, 00],
				[00, 00, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[14, 14, 14, 14, 14, 14, 14, 00, 00, 00, 00, 14, 14, 14, 14, 14, 14, 14],
				[00, 20, 20, 20, 20, 20, 20, 20, 00, 00, 20, 20, 20, 20, 20, 20, 20, 00],
				[15, 15, 15, 15, 15, 15, 15, 00, 00, 00, 00, 15, 15, 15, 15, 15, 15, 15],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 00, 00],
				[00, 20, 20, 20, 20, 20, 20, 20, 00, 00, 20, 20, 20, 20, 20, 20, 20, 00],
				[00, 00, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[09, 09, 09, 01, 01, 01, 09, 09, 09, 02, 02, 02, 09, 09, 09, 03, 03, 03],
				[09, 09, 09, 01, 01, 01, 09, 09, 09, 02, 02, 02, 09, 09, 09, 03, 03, 03],
				[09, 09, 09, 01, 01, 01, 09, 09, 09, 02, 02, 02, 09, 09, 09, 03, 03, 03],
				[09, 09, 09, 01, 01, 01, 09, 09, 09, 02, 02, 02, 09, 09, 09, 03, 03, 03],
				[06, 06, 06, 09, 09, 09, 05, 05, 05, 09, 09, 09, 04, 04, 04, 09, 09, 09],
				[06, 06, 06, 09, 09, 09, 05, 05, 05, 09, 09, 09, 04, 04, 04, 09, 09, 09],
				[06, 06, 06, 09, 09, 09, 05, 05, 05, 09, 09, 09, 04, 04, 04, 09, 09, 09],
				[06, 06, 06, 09, 09, 09, 05, 05, 05, 09, 09, 09, 04, 04, 04, 09, 09, 09],
				[09, 09, 09, 12, 12, 12, 09, 09, 09, 06, 06, 06, 09, 09, 09, 14, 14, 14],
				[09, 09, 09, 12, 12, 12, 09, 09, 09, 06, 06, 06, 09, 09, 09, 14, 14, 14],
				[09, 09, 09, 12, 12, 12, 09, 09, 09, 06, 06, 06, 09, 09, 09, 14, 14, 14],
				[09, 09, 09, 12, 12, 12, 09, 09, 09, 06, 06, 06, 09, 09, 09, 14, 14, 14],
				[17, 17, 17, 09, 09, 09, 16, 16, 16, 09, 09, 09, 15, 15, 15, 09, 09, 09],
				[17, 17, 17, 09, 09, 09, 16, 16, 16, 09, 09, 09, 15, 15, 15, 09, 09, 09],
				[17, 17, 17, 09, 09, 09, 16, 16, 16, 09, 09, 09, 15, 15, 15, 09, 09, 09],
				[17, 17, 17, 09, 09, 09, 16, 16, 16, 09, 09, 09, 15, 15, 15, 09, 09, 09],
				[09, 09, 09, 18, 18, 18, 09, 09, 09, 19, 19, 19, 09, 09, 09, 13, 13, 13],
				[09, 09, 09, 18, 18, 18, 09, 09, 09, 19, 19, 19, 09, 09, 09, 13, 13, 13],
				[09, 09, 09, 18, 18, 18, 09, 09, 09, 19, 19, 19, 09, 09, 09, 13, 13, 13],
				[09, 09, 09, 18, 18, 18, 09, 09, 09, 19, 19, 19, 09, 09, 09, 13, 13, 13],
				[15, 15, 15, 09, 09, 09, 03, 03, 03, 09, 09, 09, 01, 01, 01, 09, 09, 09],
				[15, 15, 15, 09, 09, 09, 03, 03, 03, 09, 09, 09, 01, 01, 01, 09, 09, 09],
				[15, 15, 15, 09, 09, 09, 03, 03, 03, 09, 09, 09, 01, 01, 01, 09, 09, 09],
				[15, 15, 15, 09, 09, 09, 03, 03, 03, 09, 09, 09, 01, 01, 01, 09, 09, 09],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 04, 04, 04, 04, 04, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 04, 04, 04, 04, 04, 04, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 22, 22, 22, 05, 05, 05, 05, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 22, 05, 22, 22, 05, 05, 07, 05, 05, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 22, 05, 22, 05, 05, 05, 07, 05, 05, 05, 00, 00, 00, 00],
				[00, 00, 00, 00, 22, 05, 22, 22, 05, 05, 07, 05, 05, 05, 05, 00, 00, 00],
				[00, 00, 00, 00, 22, 05, 22, 22, 05, 05, 05, 07, 05, 05, 05, 00, 00, 00],
				[00, 00, 00, 00, 00, 22, 05, 05, 05, 05, 07, 07, 07, 07, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 05, 05, 05, 05, 05, 05, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 05, 05, 05, 05, 05, 05, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 04, 04, 21, 04, 04, 21, 04, 04, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 04, 04, 21, 04, 04, 21, 04, 04, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 04, 04, 04, 21, 04, 04, 21, 04, 04, 04, 00, 00, 00, 00],
				[00, 00, 00, 00, 04, 04, 04, 21, 04, 04, 21, 04, 04, 04, 00, 00, 00, 00],
				[00, 00, 00, 04, 04, 04, 04, 21, 21, 21, 21, 04, 04, 04, 04, 00, 00, 00],
				[00, 00, 00, 04, 04, 04, 04, 21, 21, 21, 21, 04, 04, 04, 04, 00, 00, 00],
				[00, 00, 00, 05, 05, 04, 21, 05, 21, 21, 05, 21, 04, 05, 05, 00, 00, 00],
				[00, 00, 00, 05, 05, 05, 21, 21, 21, 21, 21, 21, 05, 05, 05, 00, 00, 00],
				[00, 00, 00, 05, 05, 05, 21, 21, 21, 21, 21, 21, 05, 05, 05, 00, 00, 00],
				[00, 00, 00, 05, 05, 21, 21, 21, 21, 21, 21, 21, 21, 05, 05, 00, 00, 00],
				[00, 00, 00, 00, 00, 21, 21, 21, 00, 00, 21, 21, 21, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 21, 21, 21, 00, 00, 21, 21, 21, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 22, 22, 22, 00, 00, 00, 00, 22, 22, 22, 00, 00, 00, 00],
				[00, 00, 00, 22, 22, 22, 22, 00, 00, 00, 00, 22, 22, 22, 22, 00, 00, 00],
				[00, 00, 00, 22, 22, 22, 22, 00, 00, 00, 00, 22, 22, 22, 22, 00, 00, 00],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 04, 04, 04, 04, 04, 04, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00, 00, 00],
				[00, 00, 00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00, 00, 00],
				[00, 00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00, 00],
				[00, 00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00, 00],
				[00, 00, 04, 04, 04, 99, 99, 04, 04, 04, 04, 99, 99, 04, 04, 04, 00, 00],
				[00, 00, 04, 04, 99, 99, 99, 99, 04, 04, 99, 99, 99, 99, 04, 04, 00, 00],
				[00, 00, 04, 04, 21, 21, 99, 99, 04, 04, 21, 21, 99, 99, 04, 04, 00, 00],
				[00, 00, 04, 04, 21, 21, 99, 99, 04, 04, 21, 21, 99, 99, 04, 04, 00, 00],
				[00, 00, 04, 04, 21, 21, 99, 99, 04, 04, 21, 21, 99, 99, 04, 04, 00, 00],
				[00, 00, 04, 04, 21, 21, 99, 99, 04, 04, 21, 21, 99, 99, 04, 04, 00, 00],
				[00, 00, 04, 04, 04, 99, 99, 04, 04, 04, 04, 99, 99, 04, 04, 04, 00, 00],
				[00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00],
				[00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00],
				[00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00],
				[00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00],
				[00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00],
				[00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00],
				[00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00],
				[00, 00, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 00, 00],
				[00, 00, 04, 04, 00, 04, 04, 04, 00, 00, 04, 04, 04, 00, 04, 04, 00, 00],
				[00, 00, 04, 04, 00, 04, 04, 04, 00, 00, 04, 04, 04, 00, 04, 04, 00, 00],
				[00, 00, 04, 00, 00, 00, 04, 04, 00, 00, 04, 04, 00, 00, 00, 04, 00, 00],
				[00, 00, 04, 00, 00, 00, 04, 04, 00, 00, 04, 04, 00, 00, 00, 04, 00, 00],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 01, 01, 01, 01, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 01, 01, 01, 01, 01, 01, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 01, 01, 01, 01, 01, 01, 01, 01, 00, 00, 00, 00],
				[00, 00, 00, 00, 23, 00, 01, 22, 22, 22, 22, 22, 22, 01, 00, 23, 00, 00],
				[00, 00, 00, 00, 23, 00, 22, 22, 22, 22, 22, 22, 22, 22, 00, 23, 00, 00],
				[00, 00, 00, 00, 23, 23, 22, 23, 01, 23, 23, 01, 23, 22, 23, 23, 00, 00],
				[00, 00, 00, 00, 23, 23, 22, 23, 01, 23, 23, 01, 23, 22, 23, 23, 00, 00],
				[00, 00, 00, 00, 23, 23, 22, 23, 22, 23, 23, 22, 23, 22, 23, 23, 00, 00],
				[00, 00, 00, 00, 00, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 22, 00, 00],
				[00, 00, 00, 00, 00, 00, 01, 23, 23, 22, 22, 23, 23, 01, 22, 22, 00, 00],
				[00, 00, 00, 00, 22, 22, 22, 22, 23, 23, 23, 23, 01, 01, 01, 23, 00, 00],
				[00, 00, 00, 22, 22, 23, 22, 22, 22, 22, 01, 01, 01, 01, 01, 23, 00, 00],
				[00, 00, 00, 22, 23, 23, 23, 22, 22, 23, 22, 22, 01, 01, 22, 00, 00, 00],
				[00, 00, 00, 22, 22, 23, 22, 22, 22, 23, 01, 22, 22, 22, 01, 00, 00, 00],
				[00, 00, 00, 22, 22, 23, 22, 22, 22, 23, 22, 22, 01, 01, 01, 00, 00, 00],
				[00, 00, 00, 22, 22, 23, 22, 22, 22, 23, 01, 01, 01, 22, 00, 00, 00, 00],
				[00, 00, 00, 22, 22, 22, 22, 22, 23, 23, 01, 01, 01, 22, 00, 00, 00, 00],
				[00, 00, 00, 00, 23, 23, 23, 23, 23, 00, 00, 22, 22, 22, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 22, 22, 22, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 22, 22, 22, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 07, 07, 07, 00, 00, 00, 00, 07, 07, 07, 00, 00, 00, 00],
				[00, 00, 00, 07, 25, 25, 25, 07, 00, 00, 07, 25, 25, 24, 07, 00, 00, 00],
				[00, 00, 00, 07, 25, 25, 25, 07, 00, 00, 07, 25, 25, 24, 07, 00, 00, 00],
				[00, 00, 07, 25, 26, 27, 26, 25, 07, 07, 25, 25, 25, 25, 24, 07, 00, 00],
				[00, 00, 07, 25, 26, 27, 26, 25, 07, 07, 25, 25, 25, 25, 24, 07, 00, 00],
				[00, 07, 25, 26, 27, 25, 25, 25, 25, 25, 25, 25, 25, 25, 24, 04, 07, 00],
				[00, 07, 25, 26, 27, 25, 25, 25, 25, 25, 25, 25, 25, 25, 24, 04, 07, 00],
				[00, 07, 25, 27, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 24, 04, 07, 00],
				[00, 07, 25, 27, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 24, 04, 07, 00],
				[00, 07, 25, 26, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 24, 04, 07, 00],
				[00, 07, 25, 26, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 24, 04, 07, 00],
				[00, 07, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 24, 04, 07, 00],
				[00, 07, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 24, 04, 07, 00],
				[00, 00, 07, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 24, 04, 07, 00, 00],
				[00, 00, 07, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 24, 04, 07, 00, 00],
				[00, 00, 07, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 24, 04, 07, 00, 00],
				[00, 00, 07, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 24, 04, 07, 00, 00],
				[00, 00, 00, 07, 25, 25, 25, 25, 25, 25, 25, 25, 24, 04, 07, 00, 00, 00],
				[00, 00, 00, 07, 25, 25, 25, 25, 25, 25, 25, 25, 24, 04, 07, 00, 00, 00],
				[00, 00, 00, 00, 07, 25, 25, 25, 25, 25, 25, 24, 04, 07, 00, 00, 00, 00],
				[00, 00, 00, 00, 07, 25, 25, 25, 25, 25, 25, 24, 04, 07, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 07, 25, 25, 25, 25, 24, 04, 07, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 07, 25, 25, 25, 25, 24, 04, 07, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 07, 25, 25, 24, 04, 07, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 07, 25, 25, 24, 04, 07, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 07, 24, 04, 07, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 07, 24, 04, 07, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 07, 07, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00],
				[00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11],
				[11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00],
				[00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11],
				[11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00],
				[00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11],
				[11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00],
				[00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11],
				[11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00],
				[00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11],
				[11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00],
				[00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11],
				[11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00],
				[00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11],
				[11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00],
				[00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11],
				[11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00],
				[00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11],
				[11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00],
				[00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11],
				[11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00],
				[00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11],
				[11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00],
				[00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11],
				[11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00],
				[00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11],
				[11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00],
				[00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11, 00, 11],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 12, 12, 12, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 12, 12, 12, 12, 01, 01, 01, 01, 01, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 12, 12, 01, 01, 01, 01, 01, 01, 01, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 12, 01, 01, 01, 01, 01, 01, 01, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 01, 01, 01, 01, 99, 99, 01, 99, 01, 00, 00, 00],
				[00, 00, 00, 12, 12, 12, 01, 01, 01, 99, 99, 00, 01, 00, 99, 00, 00, 00],
				[00, 00, 00, 00, 12, 01, 01, 01, 01, 99, 99, 00, 01, 00, 99, 00, 00, 00],
				[00, 00, 00, 00, 12, 01, 01, 01, 01, 99, 99, 00, 01, 00, 99, 01, 00, 00],
				[00, 00, 00, 00, 00, 01, 01, 01, 01, 99, 99, 00, 01, 00, 99, 01, 00, 00],
				[00, 00, 00, 00, 00, 01, 01, 01, 01, 99, 99, 00, 01, 00, 99, 01, 00, 00],
				[00, 00, 00, 12, 12, 01, 01, 01, 01, 99, 99, 00, 01, 00, 99, 01, 00, 00],
				[00, 00, 00, 00, 12, 01, 01, 01, 01, 01, 99, 99, 01, 99, 01, 00, 00, 00],
				[00, 00, 00, 00, 00, 01, 12, 01, 01, 00, 00, 00, 99, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 01, 12, 12, 12, 01, 01, 01, 01, 01, 01, 01, 00, 00, 00],
				[00, 00, 00, 00, 01, 12, 12, 12, 01, 01, 99, 99, 99, 99, 00, 00, 00, 00],
				[00, 00, 00, 00, 01, 12, 12, 12, 01, 01, 99, 99, 99, 99, 00, 00, 00, 00],
				[00, 00, 00, 00, 01, 12, 12, 12, 01, 01, 99, 99, 99, 99, 99, 00, 00, 00],
				[00, 00, 00, 12, 01, 12, 12, 01, 01, 99, 99, 99, 99, 99, 99, 00, 00, 00],
				[00, 00, 00, 12, 01, 12, 12, 01, 01, 99, 99, 99, 99, 99, 99, 00, 00, 00],
				[00, 00, 12, 01, 01, 01, 01, 01, 12, 12, 99, 99, 99, 99, 99, 00, 00, 00],
				[00, 00, 12, 01, 01, 01, 01, 01, 12, 12, 99, 99, 99, 99, 99, 00, 00, 00],
				[00, 01, 01, 01, 01, 01, 01, 12, 12, 12, 12, 99, 99, 99, 12, 12, 00, 00],
				[00, 01, 01, 01, 01, 01, 01, 12, 12, 12, 12, 99, 99, 99, 12, 12, 12, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 07, 07, 07, 07, 07, 07, 07, 00, 00, 00, 07, 00, 00, 00, 00],
				[00, 00, 07, 02, 02, 02, 02, 02, 02, 02, 07, 00, 07, 02, 07, 00, 00, 00],
				[00, 00, 07, 02, 02, 02, 02, 02, 02, 02, 02, 07, 07, 02, 07, 00, 00, 00],
				[00, 00, 00, 07, 02, 02, 02, 07, 23, 02, 02, 02, 02, 02, 07, 00, 00, 00],
				[00, 00, 00, 07, 02, 02, 02, 07, 23, 02, 02, 02, 02, 02, 07, 00, 00, 00],
				[00, 00, 00, 00, 07, 02, 02, 07, 23, 23, 02, 02, 02, 02, 07, 00, 00, 00],
				[00, 00, 00, 00, 07, 02, 02, 07, 23, 02, 02, 02, 02, 02, 07, 00, 00, 00],
				[00, 00, 00, 00, 00, 07, 02, 07, 23, 02, 02, 02, 02, 02, 02, 07, 00, 00],
				[00, 00, 00, 00, 00, 07, 02, 02, 02, 02, 02, 02, 02, 02, 02, 07, 00, 00],
				[00, 00, 00, 00, 07, 02, 02, 02, 02, 02, 99, 99, 02, 02, 02, 99, 00, 00],
				[00, 00, 00, 00, 07, 02, 02, 02, 02, 02, 99, 99, 02, 02, 02, 99, 00, 00],
				[00, 00, 00, 07, 02, 02, 02, 02, 02, 99, 99, 99, 99, 02, 99, 99, 00, 00],
				[00, 00, 00, 07, 02, 02, 02, 02, 02, 99, 99, 99, 99, 02, 99, 99, 00, 00],
				[00, 00, 07, 02, 02, 02, 02, 02, 02, 99, 99, 99, 15, 02, 99, 15, 00, 00],
				[00, 00, 07, 02, 02, 02, 02, 02, 02, 99, 99, 99, 15, 02, 99, 15, 00, 00],
				[00, 07, 02, 02, 07, 07, 02, 02, 02, 99, 99, 99, 07, 02, 99, 07, 00, 00],
				[00, 07, 07, 07, 00, 07, 02, 02, 02, 99, 99, 99, 07, 02, 99, 07, 00, 00],
				[00, 00, 00, 00, 07, 02, 02, 02, 02, 99, 99, 99, 15, 99, 07, 07, 07, 00],
				[00, 00, 00, 00, 07, 02, 02, 02, 02, 02, 99, 99, 15, 99, 07, 07, 07, 00],
				[00, 00, 00, 07, 02, 02, 02, 02, 23, 23, 99, 99, 99, 23, 23, 07, 00, 00],
				[00, 00, 00, 07, 02, 02, 02, 02, 23, 23, 99, 99, 99, 23, 23, 07, 00, 00],
				[00, 00, 07, 02, 02, 02, 02, 02, 23, 23, 23, 23, 23, 23, 07, 00, 00, 00],
				[00, 00, 07, 02, 02, 02, 02, 02, 23, 23, 23, 23, 23, 23, 07, 00, 00, 00],
				[00, 07, 02, 02, 02, 02, 07, 07, 07, 23, 23, 23, 23, 07, 00, 00, 00, 00],
				[00, 07, 07, 07, 07, 07, 00, 00, 07, 23, 23, 23, 23, 07, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 07, 07, 07, 07, 00, 00, 00, 00, 00],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 99, 99, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 99, 99, 04, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 99, 21, 02, 99, 04, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 99, 99, 02, 02, 99, 12, 04, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 99, 00, 99, 21, 02, 99, 28, 12, 04, 00, 00, 00, 00],
				[00, 00, 00, 00, 99, 00, 99, 21, 02, 02, 02, 99, 28, 12, 04, 00, 00, 00],
				[00, 00, 00, 99, 00, 00, 99, 02, 21, 07, 02, 99, 01, 28, 12, 04, 00, 00],
				[00, 00, 99, 00, 00, 00, 99, 02, 07, 07, 02, 99, 02, 01, 28, 12, 04, 00],
				[00, 99, 00, 00, 00, 99, 02, 02, 07, 07, 02, 02, 99, 02, 01, 28, 12, 04],
				[99, 00, 00, 00, 00, 99, 02, 07, 07, 07, 07, 02, 99, 03, 02, 01, 28, 12],
				[00, 00, 00, 00, 00, 99, 02, 07, 07, 07, 07, 02, 99, 00, 03, 02, 01, 28],
				[00, 00, 00, 00, 99, 99, 02, 02, 02, 02, 02, 02, 99, 99, 00, 03, 02, 01],
				[00, 00, 00, 00, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 00, 00, 03, 02],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 03, 03],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 03],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 28, 28, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 28, 28, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 28, 28, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 28, 28, 28, 28, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 28, 28, 28, 28, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 28, 28, 28, 28, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 28, 28, 28, 28, 28, 28, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 28, 28, 28, 28, 28, 28, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 28, 28, 28, 28, 28, 28, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 28, 28, 28, 28, 28, 28, 28, 28, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 28, 28, 28, 28, 28, 28, 28, 28, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 28, 28, 28, 28, 28, 28, 28, 28, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 28, 28, 00, 00, 00, 00, 00, 00, 28, 28, 00, 00, 00, 00],
				[00, 00, 00, 00, 28, 28, 00, 00, 00, 00, 00, 00, 28, 28, 00, 00, 00, 00],
				[00, 00, 00, 00, 28, 28, 00, 00, 00, 00, 00, 00, 28, 28, 00, 00, 00, 00],
				[00, 00, 00, 28, 28, 28, 28, 00, 00, 00, 00, 28, 28, 28, 28, 00, 00, 00],
				[00, 00, 00, 28, 28, 28, 28, 00, 00, 00, 00, 28, 28, 28, 28, 00, 00, 00],
				[00, 00, 00, 28, 28, 28, 28, 00, 00, 00, 00, 28, 28, 28, 28, 00, 00, 00],
				[00, 00, 28, 28, 28, 28, 28, 28, 00, 00, 28, 28, 28, 28, 28, 28, 00, 00],
				[00, 00, 28, 28, 28, 28, 28, 28, 00, 00, 28, 28, 28, 28, 28, 28, 00, 00],
				[00, 00, 28, 28, 28, 28, 28, 28, 00, 00, 28, 28, 28, 28, 28, 28, 00, 00],
				[00, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 00],
				[00, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 00],
				[00, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 13, 13, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 13, 13, 13, 13, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 13, 13, 13, 13, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 13, 13, 13, 13, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 13, 13, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 22, 22, 00, 00, 00, 00],
				[00, 00, 00, 02, 09, 02, 00, 00, 00, 00, 00, 22, 22, 22, 22, 22, 00, 00],
				[00, 00, 09, 09, 09, 09, 09, 00, 00, 00, 22, 22, 22, 22, 22, 22, 00, 00],
				[00, 09, 09, 09, 02, 07, 02, 09, 00, 00, 07, 07, 07, 07, 07, 22, 22, 00],
				[00, 09, 09, 09, 02, 07, 02, 09, 00, 00, 07, 28, 07, 28, 07, 22, 22, 00],
				[00, 02, 02, 09, 02, 02, 02, 09, 00, 00, 07, 28, 07, 28, 07, 22, 22, 00],
				[00, 02, 02, 09, 09, 09, 04, 09, 00, 00, 07, 07, 07, 07, 07, 22, 22, 00],
				[00, 09, 09, 09, 09, 09, 04, 09, 00, 00, 22, 22, 22, 22, 22, 22, 00, 00],
				[00, 99, 99, 99, 07, 07, 07, 99, 99, 00, 00, 22, 22, 22, 22, 22, 00, 00],
				[00, 99, 99, 99, 07, 07, 07, 99, 99, 00, 00, 00, 22, 22, 22, 00, 00, 00],
				[99, 99, 99, 09, 99, 02, 99, 99, 99, 00, 00, 00, 22, 22, 22, 00, 00, 00],
				[99, 99, 99, 09, 99, 02, 99, 99, 99, 00, 00, 22, 22, 22, 22, 22, 22, 00],
				[99, 02, 99, 09, 99, 02, 99, 99, 99, 00, 22, 22, 22, 22, 22, 22, 22, 22],
				[99, 02, 99, 09, 99, 02, 99, 99, 99, 00, 22, 22, 22, 22, 22, 22, 22, 22],
				[99, 02, 99, 99, 99, 99, 99, 99, 00, 00, 22, 22, 22, 22, 22, 22, 22, 22],
				[99, 02, 99, 99, 99, 99, 99, 99, 00, 00, 07, 00, 22, 22, 22, 22, 00, 07],
				[00, 02, 99, 09, 99, 02, 99, 99, 00, 00, 07, 00, 22, 22, 22, 22, 00, 07],
				[00, 02, 99, 09, 99, 02, 99, 99, 00, 00, 00, 00, 22, 22, 22, 22, 22, 00],
				[00, 02, 12, 00, 00, 00, 09, 12, 00, 00, 00, 00, 22, 22, 22, 22, 22, 00],
				[00, 02, 12, 00, 00, 00, 09, 12, 00, 00, 00, 07, 07, 00, 07, 07, 00, 00],
				[09, 09, 09, 09, 00, 09, 09, 09, 99, 00, 00, 07, 07, 00, 07, 07, 00, 00],
				[23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23],
				[23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23],
			],
			[
				[01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18],
				[19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 07, 07, 07, 00, 00, 00, 00, 00, 00, 07, 07, 07, 00, 00, 00],
				[00, 00, 07, 07, 07, 07, 07, 00, 00, 00, 00, 07, 07, 07, 07, 07, 00, 00],
				[00, 07, 07, 11, 11, 11, 07, 07, 00, 00, 07, 07, 11, 11, 11, 07, 07, 00],
				[00, 07, 11, 11, 11, 11, 11, 07, 00, 00, 07, 11, 11, 11, 11, 11, 07, 00],
				[07, 11, 11, 11, 27, 11, 11, 11, 07, 07, 11, 11, 11, 27, 11, 11, 11, 07],
				[07, 11, 11, 11, 27, 11, 11, 11, 07, 07, 11, 11, 11, 27, 11, 11, 11, 07],
				[00, 07, 11, 11, 11, 11, 11, 07, 00, 00, 07, 11, 11, 11, 11, 11, 07, 00],
				[00, 07, 07, 11, 11, 11, 07, 07, 00, 00, 07, 07, 11, 11, 11, 07, 07, 00],
				[00, 00, 07, 07, 07, 07, 07, 00, 00, 00, 00, 07, 07, 07, 07, 07, 00, 00],
				[00, 00, 00, 07, 07, 07, 00, 00, 00, 00, 00, 00, 07, 07, 07, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 98, 00, 00, 00, 00, 00, 00, 00, 00, 98],
				[00, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 98, 00, 00, 00, 00, 00, 00, 00, 00],
				[20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 98, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 98, 00, 00, 00, 00, 00, 00, 00, 00],
				[20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 98, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 98, 00, 00, 00, 00, 00, 00, 00, 00],
				[20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 98, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 98, 00, 00, 00, 00, 00, 00, 00, 00],
				[20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 98, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 98, 00, 00, 00, 00, 00, 00, 00, 00],
				[20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 98, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 98, 00, 00, 00, 00, 00, 00, 00, 00],
				[20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 98, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 98, 00, 00, 00, 00, 00, 00, 00, 00],
				[20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 98, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 26, 26, 26, 26, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00],
				[00, 00, 00, 00, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 00, 00, 00, 00],
				[00, 00, 00, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 00, 00, 00],
				[00, 00, 00, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 00, 00, 00],
				[00, 00, 00, 26, 26, 26, 26, 26, 00, 00, 26, 26, 26, 26, 26, 00, 00, 00],
				[00, 00, 00, 26, 26, 26, 26, 26, 00, 00, 26, 26, 26, 26, 26, 00, 00, 00],
				[00, 00, 00, 00, 26, 26, 26, 00, 00, 00, 00, 26, 26, 26, 00, 00, 00, 00],
				[00, 00, 00, 00, 26, 26, 26, 00, 00, 00, 00, 26, 26, 26, 00, 00, 00, 00],
			],
			[
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 07, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 07, 20, 07, 00, 00, 00, 00, 00, 00, 00, 00, 07, 07, 00, 00, 00, 00],
				[07, 20, 20, 20, 07, 00, 00, 00, 00, 00, 00, 00, 07, 07, 00, 00, 00, 00],
				[07, 20, 20, 20, 20, 07, 07, 07, 07, 07, 07, 07, 26, 26, 07, 00, 00, 00],
				[00, 07, 20, 20, 20, 20, 20, 20, 20, 20, 20, 26, 26, 26, 07, 00, 00, 00],
				[00, 00, 07, 20, 20, 20, 20, 20, 20, 20, 20, 20, 26, 26, 07, 00, 99, 99],
				[00, 00, 07, 20, 20, 20, 20, 20, 20, 20, 20, 20, 26, 26, 07, 00, 99, 99],
				[00, 07, 20, 20, 20, 20, 20, 20, 20, 20, 20, 26, 26, 26, 07, 00, 00, 00],
				[07, 20, 20, 20, 20, 07, 07, 07, 07, 07, 07, 07, 26, 26, 07, 00, 00, 00],
				[07, 20, 20, 20, 07, 00, 00, 00, 00, 00, 00, 00, 07, 07, 00, 00, 00, 00],
				[00, 07, 20, 07, 00, 00, 00, 00, 00, 00, 00, 00, 07, 07, 00, 00, 00, 00],
				[00, 00, 07, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
				[11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
			],
		];
		balls = [new Ball(5,new Vector(width/2, height-15),true)];
		paddle = new Paddle(new Vector(width/2, height));
		bricks = new Bricks(levels[levelAt]);
		powerups = [];
		shots = [];
		shootingPaddle = false;
		console.log('Init the game');
		console.log('LevelAt: ' + (levelAt + 1));
		play_multi_sound('start');
	},
	mouseMove = function(event){
		documentWidth = document.width || document.documentElement.clientWidth;
		if(event.pageX < (documentWidth - width)/2 + paddle.width/2){
			paddle.position.x = paddle.width/2;
		}
		else if(event.pageX > documentWidth - (documentWidth - width)/2 - paddle.width/2){
			paddle.position.x = width - paddle.width/2;
		}
		else{
			paddle.position.x = event.pageX - ((documentWidth - width)/2);
		}
	},
	releaseBalls = function(){
		var i;
		if(startScreen === true){
			startScreen = false;
			gameLoop();
		}
		else if(levels[levelAt] === undefined || (lives === 0 && balls.length === 0)){
			startScreen = true;
			initGame();
			render();
		}
		else{
			for(i = 0; i < balls.length; i += 1){
				balls[i].stuck = false;
			}
			if(shootingPaddle === true){
				shots.push(new Shot(new Vector(paddle.position.x - paddle.width/2 + 4, height - paddle.height)));
				shots.push(new Shot(new Vector(paddle.position.x + paddle.width/2 - 7, height - paddle.height)));
			}
		}
	},
	update = function(td){
		var i, j, length;
		paddle.update(width);
		for(i = 0; i < balls.length; i += 1){
			balls[i].update(paddle, bricks, td, width, height, powerups);
			if(balls[i].alive === false){
				balls.splice(i,1);
			}
		}
		for(i = 0; i < shots.length; i += 1){
			shots[i].update(bricks, td, powerups);
			if(shots[i].alive === false){
				shots.splice(i,1);
			}
		}
		for(i = 0; i < powerups.length; i += 1){
			powerups[i].update(paddle, td, width, height);
			if(powerups[i].grabbed === true){
				console.log(powerups[i].effect);
				switch(powerups[i].effect){
					case 'splitBall':
						for(j = 0, length = balls.length; j < length; j += 1){
							balls.push(new Ball(balls[j].radius, new Vector(balls[j].position.x,balls[j].position.y), false, (balls[j].direction + 0.5)%(Math.PI*2), new Vector(balls[j].speed.x, balls[j].speed.y), balls[j].fireBall, balls[j].thruBrick));
							balls[j].direction = (balls[j].direction + (Math.PI*2) - 0.5)%(Math.PI*2);
						}
						break;
					case 'eightBall':
						for(j = 0, length = balls.length; j < length; j += 1){
							balls.push(new Ball(balls[j].radius, new Vector(balls[j].position.x,balls[j].position.y), false, (balls[j].direction + (Math.PI*0.25))%(Math.PI*2), new Vector(balls[j].speed.x, balls[j].speed.y), balls[j].fireBall, balls[j].thruBrick));
							balls.push(new Ball(balls[j].radius, new Vector(balls[j].position.x,balls[j].position.y), false, (balls[j].direction + (Math.PI*0.50))%(Math.PI*2), new Vector(balls[j].speed.x, balls[j].speed.y), balls[j].fireBall, balls[j].thruBrick));
							balls.push(new Ball(balls[j].radius, new Vector(balls[j].position.x,balls[j].position.y), false, (balls[j].direction + (Math.PI*0.75))%(Math.PI*2), new Vector(balls[j].speed.x, balls[j].speed.y), balls[j].fireBall, balls[j].thruBrick));
							balls.push(new Ball(balls[j].radius, new Vector(balls[j].position.x,balls[j].position.y), false, (balls[j].direction + (Math.PI))%(Math.PI*2), new Vector(balls[j].speed.x, balls[j].speed.y), balls[j].fireBall, balls[j].thruBrick));
							balls.push(new Ball(balls[j].radius, new Vector(balls[j].position.x,balls[j].position.y), false, (balls[j].direction + (Math.PI*1.25))%(Math.PI*2), new Vector(balls[j].speed.x, balls[j].speed.y), balls[j].fireBall, balls[j].thruBrick));
							balls.push(new Ball(balls[j].radius, new Vector(balls[j].position.x,balls[j].position.y), false, (balls[j].direction + (Math.PI*1.50))%(Math.PI*2), new Vector(balls[j].speed.x, balls[j].speed.y), balls[j].fireBall, balls[j].thruBrick));
							balls.push(new Ball(balls[j].radius, new Vector(balls[j].position.x,balls[j].position.y), false, (balls[j].direction + (Math.PI*1.75))%(Math.PI*2), new Vector(balls[j].speed.x, balls[j].speed.y), balls[j].fireBall, balls[j].thruBrick));
						}
						break;
					case 'fastBall':
						for(j = 0, length = balls.length; j < length; j += 1){
							balls[j].speed.x = balls[j].speed.x * 1.5;
							balls[j].speed.y = balls[j].speed.y * 1.5;
						}
						break;
					case 'slowBall':
						for(j = 0, length = balls.length; j < length; j += 1){
							balls[j].speed.x = 200;
							balls[j].speed.y = 200;
						}
						break;
					case 'megaBall':
						for(j = 0; j < balls.length; j += 1){
							balls[j].radius = 10;
						}
						break;
					case 'miniBall':
						for(j = 0; j < balls.length; j += 1){
							balls[j].radius = 2.5;
						}
						break;
					case 'fireBall':
						for(j = 0; j < balls.length; j += 1){
							balls[j].fireBall = true;
						}
						break;
					case 'thruBrick':
						for(j = 0; j < balls.length; j += 1){
							balls[j].thruBrick = true;
							thruBrick = true;
						}
						break;
					case 'expandPaddle':
						if(paddle.width < 64 * 13){
							if(paddle.width > 32){
								paddle.width += 64;
							}
							else{
								paddle.width += 32;
							}
						}
						break;
					case 'shrinkPaddle':
						if(paddle.width > 64){
							paddle.width -= 64;
						}
						else if(paddle.width === 64){
							paddle.width -= 32;
						}
						break;
					case 'miniPaddle':
						paddle.width = 32;
						break;
					case 'grabPaddle':
						paddle.grabPaddle = true;
						break;
					case 'shootingPaddle':
						shootingPaddle = true;
						paddle.shootingPaddle = true;
						break;
					case 'killPaddle':
						if(lives === 0){
							cancelRequestAnimFrame(request);
							console.log('Game Over!');
							play_multi_sound('gameover');
						}
						else{
							paddle = new Paddle(new Vector(width/2, height));
							balls = [new Ball(5,new Vector(width/2, height-15),true)];
							shots = [];
							powerups = [];
							shootingPaddle = false;
							lives -= 1;
							console.log('You have ' + lives + ' left!');
						}
						break;
					case 'fallingBricks':
						bricks.fallingBricks = true;
						break;
					case 'extraLife':
						lives += 1;
						break;
				}
				powerups.splice(i,1);
			}
			else if(powerups[i].alive === false){
				powerups.splice(i,1);
			}
		}
		if(balls.length === 0){
			if(lives === 0){
				cancelRequestAnimFrame(request);
				console.log('Game Over!');
				play_multi_sound('gameover');
			}
			else{
				paddle = new Paddle(new Vector(width/2, height));
				balls = [new Ball(5,new Vector(width/2, height-15),true)];
				shots = [];
				powerups = [];
				shootingPaddle = false;
				lives -= 1;
				console.log('You have ' + lives + ' extra lives left!');
			}
		}
		if(bricks.nrOfBricks === 0){
			levelAt += 1;
			if(levels[levelAt] === undefined){
				cancelRequestAnimFrame(request);
				console.log('You have Won!');
				play_multi_sound('won');
			}
			else{
				paddle = new Paddle(new Vector(width/2, height));
				bricks = new Bricks(levels[levelAt]);
				balls = [new Ball(5,new Vector(width/2, height-15),true)];
				shots = [];
				powerups = [];
				shootingPaddle = false;
				console.log('LevelAt: ' + (levelAt +1));
				play_multi_sound('nextlevel');
			}
		}
	},
	render = function(){
		var i;
		ctx.clearRect(0,0,width,height);
		if(startScreen === true){
			ctx.beginPath();
			ctx.font = 'italic bold 64px sans-serif';
			ctx.textBaseline = 'bottom';
			ctx.fillStyle = '#FFF';
			ctx.fillText('Awesome Ball Game 1.0!', 80, 140);
			ctx.font = 'italic bold 36px sans-serif';
			ctx.fillText('Based on "Megaball" by Ed and Al Mackey', 100, 200);
			ctx.fillText('Press any key to play!', 260, 600);
			ctx.font = 'italic bold 12px sans-serif';
			ctx.fillText('by Magnus Bellstrand', 700, 150);

			ctx.fillText('Extra Life', 273, 540);
			ctx.fillText('Fire Ball', 375, 300);
			ctx.fillText('Thru Brick', 370, 360);
			ctx.fillText('Shooting Paddle', 355, 420);
			ctx.fillText('Grab Paddle', 365, 480);
			ctx.fillText('Slow Ball', 373, 540);
			ctx.fillText('Kill Paddle', 469, 300);
			ctx.fillText('Mini Ball', 475, 360);
			ctx.fillText('Fast Ball', 475, 420);
			ctx.fillText('Mini Paddle', 467, 480);
			ctx.fillText('Falling Bricks', 460, 540);
			ctx.fillText('Expand Paddle', 555, 300);
			ctx.fillText('Shrink Paddle', 560, 360);
			ctx.fillText('Split Ball', 573, 420);
			ctx.fillText('Eight Ball', 570, 480);
			ctx.fillText('Mega Ball', 570, 540);
			for(i = 0; i < startScreenPowerups.length; i += 1){
				startScreenPowerups[i].draw(ctx);
			}
		}
		else if(balls.length === 0 && lives === 0){
			ctx.beginPath();
			ctx.font = 'italic bold 128px sans-serif';
			ctx.textBaseline = 'bottom';
			ctx.fillStyle = '#FFF';
			ctx.fillText('Game Over!', 100, 300);
			ctx.font = 'italic bold 36px sans-serif';
			ctx.fillText('Press any key to play again!', 230, 400);
		}
		else if(levels[levelAt] === undefined){
			ctx.beginPath();
			ctx.font = 'italic bold 128px sans-serif';
			ctx.textBaseline = 'bottom';
			ctx.fillStyle = '#FFF';
			ctx.fillText('You Won!', 160, 300);
			ctx.font = 'italic bold 36px sans-serif';
			ctx.fillText('Press any key to play again!', 230, 400);
		}
		else{
			paddle.draw(ctx);
			bricks.draw(ctx);
			for(i = 0; i < powerups.length; i += 1){
				powerups[i].draw(ctx);
			}
			for(i = 0; i < shots.length; i += 1){
				shots[i].draw(ctx);
			}
			for(i = 0; i < balls.length; i += 1){
				balls[i].draw(ctx);
			}
			ctx.beginPath();
			ctx.font = 'italic bold 30px sans-serif';
			ctx.textBaseline = 'bottom';
			ctx.fillStyle = '#FFF';
			if(lives < 10){
				ctx.fillText(lives, 900, 35);
			}
			else{
				ctx.fillText(lives, 885, 35);
			}
		}
	},
	nextLevel = function(){
		bricks.nrOfBricks = 0;
	},
	pause = function(){
		if(pause === request){
			lastGameTick = Date.now();
			gameLoop();
			console.log('Game Unpaused');
		}
		else{
			cancelRequestAnimFrame(request);
			pause = request;
			console.log('Game Paused!');
		}
	},
	gameLoop = function(){
		now = Date.now();
		td = (now - (lastGameTick || now)) / 1000;
		lastGameTick = now;
		request = requestAnimFrame(gameLoop);
		update(td);
		render();
	}
	return{
		'init': init,
		'mouseMove': mouseMove,
		'releaseBalls': releaseBalls,
		'nextLevel': nextLevel,
		'pause': pause, 
		'gameLoop': gameLoop
	}
})();

$(document).ready(function(){
	'use strict';
	document.getElementById('box').innerHTML +=
		'<audio id="ball-hit-border" src="sounds/ball-hit-border.ogg" preload="auto"></audio>' +
		'<audio id="ball-hit-brick" src="sounds/ball-hit-brick.ogg" preload="auto"></audio>' +
		'<audio id="ball-hit-paddle" src="sounds/ball-hit-paddle.ogg" preload="auto"></audio>' +
		'<audio id="gameover" src="sounds/gameover.ogg" preload="auto"></audio>' +
		'<audio id="start" src="sounds/start.ogg" preload="auto"></audio>' +
		'<audio id="nextlevel" src="sounds/nextlevel.ogg" preload="auto"></audio>' +
		'<audio id="won" src="sounds/won.ogg" preload="auto"></audio>';
	Breakout.init('canvas1');
	document.onmousemove = function(event){
		Breakout.mouseMove(event);
	};
	$('#canvas1').click(function(event){
		if(event.which === 1){
			Breakout.releaseBalls();
		}
		event.preventDefault();
	});
	$('#mute').click(function(event){
		event.preventDefault();
		if(muted === false){
			muted = true;
			$('#mute').html('Unmute all sounds!');
		}
		else{
			muted = false;
			$('#mute').html('Mute all sounds!');
		}

	});
});
