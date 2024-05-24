class Game{
	constructor(){
		this.pong = undefined;
		this.gameSocket = undefined;
		this.yourOriginalSide = ""; //room_id vs herşey bulunuyor
		this.bigBall = new Image();
		this.smallBall = new Image();
		this.bigPaddle = new Image();
		this.smallPaddle = new Image();
		this.rabbit = new Image();
		this.turtle = new Image();
		this.buffer = {oldscore1: 0, oldscore2: 0, score1: 0,score2: 0}
		
		this.rabbit.src = "/static/img/rabbit.png";
		this.turtle.src = "/static/img/turtle.png";
		this.smallBall.src = "/static/img/smallBall.png";
		this.bigBall.src = "/static/img/bigBall.png";
		this.smallPaddle.src = "/static/img/smallPaddle.png";
		this.bigPaddle.src = "/static/img/bigPaddle.png";

		this.imageList = [this.bigBall, this.smallBall, this.bigPaddle, this.smallPaddle, this.rabbit, this.turtle];

		this.rabbit.onload = function(){
			console.log("rabbit loaded");
		}
		this.turtle.onload = function(){
			console.log("turtle loaded");
		}
		this.smallBall.onload = function(){
			console.log("smallBall loaded");
		}
		this.bigBall.onload = function(){
			console.log("bigBall loaded");
		}
		this.smallPaddle.onload = function(){
			console.log("smallPaddle loaded");
		}
		this.bigPaddle.onload = function(){
			console.log("bigPaddles loaded");
		}

		this.PongGame = class PongGame {
			static BIG_BALL = 1;
			static SMALL_BALL = 2;
			static BIG_PADDLE = 3;
			static SMALL_PADDLE = 4;
			static FAST_BALL = 5;
			static SLOW_BALL = 6;
			static NO_COLOR = 0;
			static RED = 1;
			static GREEN = 2;
		
			static gameReady = false;
			static WINNING_SCORE = 3;
			static WINNER_NAME = "";
			static lastRoundStartTime = 0;
			//static stopDeathRound = false;
			static isGoal = false;
		
			static powerup = {
				radius: 40,
				x : 0,
				y: 0,
				type: 0,
				borderColor: PongGame.NO_COLOR,
				active: 0,
		
		
				draw() {
					game.pong.context.fillStyle = this.borderColor == PongGame.RED  ? '#ff0000' : this.borderColor == PongGame.GREEN  ? '#00cc00' : '#333333';
					game.pong.context.beginPath();
					game.pong.context.arc(this.x * game.pong.ratio, this.y * game.pong.ratio, this.radius * game.pong.ratio, 0, Math.PI * 2);
					game.pong.context.fill();
					game.pong.context.drawImage(game.imageList[this.type - 1], (this.x - this.radius) * game.pong.ratio, (this.y - this.radius) * game.pong.ratio, this.radius * 2 * game.pong.ratio, this.radius * 2 * game.pong.ratio);
				},
		
				destroy() {
					this.borderColor = PongGame.NO_COLOR;
					this.x = 0;
					this.y = 0;
					this.type = 0;
				},
		
				reset(){
					game.pong.MAX_SPEED = 15.0;
					game.pong.ball.radius = 20.0 * game.pong.ratio;
					game.pong.leftPaddle.height = 200 * game.pong.ratio;
					game.pong.rightPaddle.height = 200 * game.pong.ratio;
					this.active = 0;
				}
			}
		
			constructor(canvasWidth, canvasHeight) {
				PongGame.WINNER_NAME = "";
				this.canvasWidth = canvasWidth;
				this.canvasHeight = canvasHeight;
				this.canvas = document.getElementById('game');
				this.context = this.canvas.getContext('2d');
				this.canvas.width = canvasWidth;
				this.canvas.height = canvasHeight;
				this.canvas.style.maxWidth = `${canvasWidth}px`;
				this.canvas.style.maxHeight = `${canvasHeight}px`;
				this.canvas.style.minWidth = `${canvasWidth}px`;
				this.canvas.style.minHeight = `${canvasHeight}px`;
				this.ratio = this.canvasWidth / 1400;
				this.data = {};
				this.oldRatio = this.ratio;
				this.score1 = 0;
				this.score2 = 0;
				this.interval = 1000 / 60;
				this.delta = 0;
				this.lastFrame = 0;
				this.frameCounter = 0;
				this.forcedWinName = "";
				this.serverDelta = 0;
				this.won = false;
				this.wait = false;
				this.ball = {
					MAX_SPEED: 15.0,
					radius: 20.0 * this.ratio,
					speedX: 0.0,
					speedY: 0.0,
					x: this.canvasWidth / 2.0,
					y: this.canvasHeight / 2.0
				};
		
				this.leftPaddle = {
					width: 6 * this.ratio,
					height: 200 * this.ratio,
					x: 10 * this.ratio,
					y: (this.canvasHeight / 2) - ((200 * this.ratio) / 2),
					speed: 20,
					resize(oldRatio, ratio, canvasWidth, canvasHeight){
						this.width =  6 * ratio;
						this.height =  200 * ratio;
						this.x = 10 * ratio;
						this.y = this.y / oldRatio * ratio;
					}
				};
		
				this.rightPaddle = {
					width: 6 * this.ratio,
					height: 200 * this.ratio,
					x: this.canvasWidth - (10 * this.ratio) - (6 * this.ratio),
					y: (this.canvasHeight / 2) - ((200 * this.ratio) / 2),
					speed: 20,
					resize(oldRatio, ratio, canvasWidth, canvasHeight){
						//console.log("innerRatio: " + ratio);
						this.width =  6 * ratio;
						this.height =  200 * ratio;
						this.x = canvasWidth - (10 * ratio) - (6 * ratio);
						this.y = this.y / oldRatio * ratio;
					}
				};
		
				this.keys = {
					38: false,
					40: false
				};
			}
		
			putLostConnection(data){
				console.log("waiting");
				const finishTime = new Date(data.wait.finishTime).getTime();
				let second = Math.ceil((finishTime - Date.now() + this.serverDelta) / 1000);
		
				let waiting = () => {
		
					this.context.fillStyle = '#000000';
					this.context.fillRect(0,0, this.canvasWidth, this.canvasHeight);
					this.context.fillStyle = '#FFFFFF';
					this.context.font = `${50 * this.canvasWidth / 1400}px regular5x3`;
					this.context.textAlign = "center";
					this.context.fillText(data.wait.disconnected.toString() + "\'s connection is weak" , this.canvasWidth / 2, this.canvasHeight / 2);
					this.context.font = `${35 * this.canvasWidth / 1400}px regular5x3`;
					this.context.fillText(second.toString() , this.canvasWidth / 2, this.canvasHeight / 2 + 35);
					second = Math.ceil((finishTime - Date.now() + this.serverDelta) / 1000);
					if (second > 0 && this.wait){
						console.log("second:" + second + " wait:" + this.wait);
						requestAnimationFrame(waiting);
					}
					else if (this.wait == false){
						this.lastFrame = performance.now();
						if (this.start("directLoop")){
							PongGame.gameReady = false;
							delete this;
						}
					}else{
						this.wait = false;
						this.won = true;
						if (this.start("directLoop")){
							PongGame.gameReady = false;
							delete this;
						}
					}
		
				}
				requestAnimationFrame(waiting);
			}
		
			Counter(deltaTime){
				const gameStartTimestamp = new Date(chat.matchStatus.game_startTimestamp).getTime();
				let second = Math.ceil((gameStartTimestamp - Date.now() + deltaTime) / 1000);
				//console.log("AYIRTEDİLEBİLİR gameStartTimestamp:" + gameStartTimestamp + " second:" + second + " deltaTime:" + deltaTime);
				let fk = () => {
					this.context.fillStyle = '#000000';
					this.context.fillRect(0,0, this.canvasWidth, this.canvasHeight);
					this.context.fillStyle = '#FFFFFF';
					this.context.font = `${50 * this.canvasWidth / 1400}px regular5x3`;
					this.context.textAlign = "center";
					this.context.fillText(second.toString(), this.canvasWidth / 2, this.canvasHeight / 2);
					second = Math.ceil((gameStartTimestamp - Date.now() + deltaTime) / 1000);
					//console.log("second:" + second);
					if (second > 0)
						requestAnimationFrame(fk);
					else{
						PongGame.gameReady = true;
						if (this.start("normal")){
							console.log("DELETING PONG2");
							PongGame.gameReady = false;
							delete this;
							console.log("DELETED PONG2");
						}
					}
				}
				requestAnimationFrame(fk);
			}
		
			resize(gameWidth) {
				this.canvas.width = gameWidth;
				this.canvas.height = Math.floor(gameWidth / 14 * 10);
				this.canvas.style.maxWidth = `${gameWidth}px`;
				this.canvas.style.maxHeight = `${Math.floor(gameWidth / 14 * 10)}px`;
				this.canvas.style.minWidth = `${gameWidth}px`;
				this.canvas.style.minHeight = `${Math.floor(gameWidth / 14 * 10)}px`;
				this.canvasWidth = gameWidth;
				this.canvasHeight = Math.floor(gameWidth / 14 * 10);
				this.ratio = this.canvasWidth / 1400;
				this.ball.radius = 20.0 * this.ratio;
				//paddles
				this.leftPaddle.resize(this.oldRatio, this.ratio, this.canvasWidth, this.canvasHeight);
				//console.log("leftPaddle:" + this.leftPaddle.width + " " + this.leftPaddle.height);
				this.rightPaddle.resize(this.oldRatio, this.ratio, this.canvasWidth, this.canvasHeight);
				this.oldRatio = this.ratio;
				if (this.won == true)
					requestAnimationFrame(() => {
						this.context.fillStyle = '#000000';
						this.context.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
						this.context.fillStyle = '#ffffff';
						this.context.font = `${50 * this.ratio}px regular5x3`;
						this.context.textAlign = "center";
						this.context.fillText(`${PongGame.WINNER_NAME} wins!`, this.canvasWidth / 2, this.canvasHeight / 2);
						chat.matchStatus = undefined;
					});
			}
		
			draw() {
				this.context.fillStyle = '#000000';
				this.context.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
		
				// Draw paddles
				this.context.fillStyle = '#ffffff';
				this.context.fillRect(this.leftPaddle.x, this.leftPaddle.y, this.leftPaddle.width, this.leftPaddle.height);
				this.context.fillRect(this.rightPaddle.x, this.rightPaddle.y, this.rightPaddle.width, this.rightPaddle.height);
		
				// Draw ball
				this.context.beginPath();
				this.context.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
				if (PongGame.powerup.active == 1)
					this.context.fillStyle = '#FFA500';
				else
					this.context.fillStyle = '#ffffff';
				this.context.fill();
		
				// Draw scores
				this.context.fillStyle = '#ffffff';
				this.context.font = `${50 * this.ratio}px regular5x3`;
				this.context.fillText(this.score1.toString(), this.canvasWidth / 4, 70 * this.ratio);
				this.context.fillText(this.score2.toString(), (3 * this.canvasWidth) / 4, 70 * this.ratio);
		
				if (PongGame.powerup.type != 0){
					PongGame.powerup.draw();
				}
			}
		
			movePaddles(){
				//console.log("movePaddles yunikmetin");
				let _data = {"u": Number(this.keys[38]), "d": Number(this.keys[40])};
				game.sendGameMessage("mv", _data);
		
				if (_data.u)
					this.rightPaddle.y -= this.rightPaddle.speed * this.ratio;
				if (_data.d)
					this.rightPaddle.y += this.rightPaddle.speed * this.ratio;
				if (this.leftPaddle.y < 0 || this.leftPaddle.y > this.canvas.height - this.leftPaddle.height)
					this.leftPaddle.y = this.leftPaddle.y < 0 ? 0 : this.canvas.height - this.leftPaddle.height;
				if (this.rightPaddle.y < 0 || this.rightPaddle.y > this.canvas.height - this.rightPaddle.height)
					this.rightPaddle.y = this.rightPaddle.y < 0 ? 0 : this.canvas.height - this.rightPaddle.height;
			}
		
			initKeyboardEvents() {
				let keys = this.keys;
				document.addEventListener("keydown", function(e){
					if (chat.matchStatus != undefined && e.keyCode in keys){
						keys[e.keyCode] = true;
						game.pong.movePaddles();
					}
				});
				document.addEventListener("keyup", function(e){
					if (chat.matchStatus != undefined && e.keyCode in keys){
						keys[e.keyCode] = false;
						game.pong.movePaddles();
					}
				});
			}
		
			update() {
				let tmp = false;
				// Move ball
				this.ball.x = Number((this.ball.x + (this.ball.speedX * (this.delta / this.interval) * this.ratio)).toFixed(6));
				this.ball.y = Number((this.ball.y + (this.ball.speedY * (this.delta / this.interval) * this.ratio)).toFixed(6));
				// Check collision with walls
				if (this.ball.y + this.ball.radius >= this.canvasHeight){
					this.ball.speedY = -1 * Math.abs(this.ball.speedY);
				}else if (this.ball.y - this.ball.radius <= 0){
					this.ball.speedY = Math.abs(this.ball.speedY);
				}
				// Check collision with paddles
				if (this.ball.speedX < 0) {
					if (this.ball.y + this.ball.radius >= this.leftPaddle.y && this.ball.y - this.ball.radius <= this.leftPaddle.y + this.leftPaddle.height) {
						if (this.ball.x - this.ball.radius <= this.leftPaddle.x + this.leftPaddle.width) {
							this.ball.speedX = Math.abs(this.ball.speedX);
							const middleY = this.leftPaddle.y + this.leftPaddle.height / 2;
							const differenceInY = middleY - this.ball.y;
							const reductionFactor = (this.leftPaddle.height / 2) / this.ball.MAX_SPEED;
							const ySpeed = differenceInY / reductionFactor;
							this.ball.speedY = Number(-ySpeed.toFixed(3));
							tmp = true;
						}
					}
				} else {
					if (this.ball.y + this.ball.radius >= this.rightPaddle.y && this.ball.y - this.ball.radius <= this.rightPaddle.y + this.rightPaddle.height) {
						if (this.ball.x + this.ball.radius >= this.rightPaddle.x) {
							this.ball.speedX = -1 * Math.abs(this.ball.speedX);
							const middleY = this.rightPaddle.y + this.rightPaddle.height / 2;
							const differenceInY = middleY - this.ball.y;
							const reductionFactor = (this.rightPaddle.height / 2) / this.ball.MAX_SPEED;
							const ySpeed = differenceInY / reductionFactor;
							this.ball.speedY = Number(-ySpeed.toFixed(3));
							tmp = true;
						}
					}
				}
				//console.log("speedX:" + this.ball.speedX + " speedY:" + this.ball.speedY);
				// Check if ball goes out of bounds
		
				/* if (this.ball.x - this.ball.radius < 0 && !tmp) {
				//	(yourOriginalSide == "right") ? this.score1++ : this.score2++;
					this.reset();
					PongGame.powerup.reset();
					console.log("LASTROUND ATADIM AMK2")
				} else if (this.ball.x + this.ball.radius > this.canvasWidth && !tmp) {
				//	(yourOriginalSide == "right") ? this.score2++ : this.score1++;
					this.reset();
					PongGame.powerup.reset();
					console.log("LASTROUND ATADIM AMK3")
				} */
			}
			reset() {
				this.ball.x = this.canvasWidth / 2;
				this.ball.y = this.canvasHeight / 2;
				this.ball.speedX = 0.0;
				this.ball.speedY = 0.0;
			}
		
			resetDeathRound(lrs){
				$(this.canvas).css("position", "static");
				$(this.canvas).css("box-shadow", "none");
				$(this.canvas).css("z-index", "0");
				$(this.canvas).css("transform", `rotate(0deg)`);
				//PongGame.stopDeathRound = true;
				PongGame.lastRoundStartTime = new Date(lrs).getTime();
			}
		
			deathRound(deg)
			{
				$(this.canvas).css("transform", `rotate(${deg.toString()}deg)`);
			}
		
			start(mode) {
				if (mode == "normal"){
					if (!PongGame.gameReady){
						game.createGameSocket();
						document.getElementById('gameMusic').volume = 0.1;
						console.log("LAAN NOLUYO RETUNR FALAN DİYO BU AMK!");
						return 0;
					}
					//KLAVYE ve simule
					this.initKeyboardEvents();
					this.lastFrame = performance.now();
				}
				let loop = (timestamp) => {
					if (!game)
						return;
					this.delta = timestamp - this.lastFrame;
					this.update();
					this.draw();
					this.lastFrame = timestamp;
					//console.log("LastRoundStartTime:" + PongGame.lastRoundStartTime);
					if (chat.matchStatus != undefined && PongGame.lastRoundStartTime && PongGame.lastRoundStartTime + this.serverDelta - Date.now() + (1000 * 60) < 0){
						$(this.canvas).css("position", "absolute");
						$(this.canvas).css("box-shadow", "0px 0px 0px 3000px rgb(0 0 0 / 90%)");
						$(this.canvas).css("z-index", "10000");
						let tmp = -1 * (PongGame.lastRoundStartTime + this.serverDelta - Date.now() + (1000 * 60));
						let deg = ((tmp * (1 + (0.1 * (tmp / 5000.0))) / 15000.0) * 360.0);
						this.deathRound(deg);
					}
					if (!this.won && this.score1 < PongGame.WINNING_SCORE && this.score2 < PongGame.WINNING_SCORE && this.wait == false && (game.gameSocket && game.gameSocket.readyState == WebSocket.OPEN)){
						requestAnimationFrame(loop);
					}else if (this.wait == true){
						console.log("ANAN ANAN YANİ");
					}else if (game.gameSocket && game.gameSocket.readyState == WebSocket.OPEN){
						game.gameSocket.close(1000);
						game.gameSocket = undefined;
					}else if (game.gameSocket == undefined){
						console.log("MATCH STATUS:" + chat.matchStatus);
						console.log("WON:" + this.won);
					}
				}
				requestAnimationFrame(loop);
				$("#gameMusic")[0].play();
				return 1;
			}

			
			finishGame(semiMatchsFinished = false){
				$("#gameMusic")[0].pause();
				console.log("game over");
				this.resetDeathRound();
				// Game over
				requestAnimationFrame(() => {
					this.context.fillStyle = '#000000';
					this.context.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
					this.context.fillStyle = '#ffffff';
					this.context.font = `${50 * this.ratio}px regular5x3`;
					this.context.textAlign = "center";
					PongGame.WINNER_NAME = this.forcedWinName;
					this.forcedWinName = "";
					this.context.fillText(`${PongGame.WINNER_NAME} wins!`, this.canvasWidth / 2, this.canvasHeight / 2);
					let volume = document.getElementById('gameMusic').volume;
					if (PongGame.WINNER_NAME == $("#player2 h4").text()){
						$("#gameMusicWon")[0].volume = volume;
						$("#gameMusicWon")[0].play();
					}else{
						$("#gameMusicLose")[0].volume = volume;
						$("#gameMusicLose")[0].play();
					}
					$("#leftTheGameBtn").text(["Geri", "Back", "Zurück"][["tr", "en", "de"].indexOf(chat.getCookie("language"))]);
					$("#leftTheGameBtn").removeAttr("data-bs-toggle");
					$("#leftTheGameBtn").removeAttr("data-bs-target");
					$("#leftTheGameBtn").click((e)=>{
						if ($("#chooseModes").hasClass("d-none"))
							$("#chooseModes").toggleClass("d-none d-flex");
						if ($("#_onGame").hasClass("d-flex"))
							$("#_onGame").toggleClass("d-none d-flex");
						PongGame.gameReady = false;
						if (game.gameSocket && game.gameSocket.readyState == WebSocket.OPEN){
							game.gameSocket.close(1000);
							game.gameSocket = undefined;
						}
					})
					chat.matchStatus = undefined;
				});
				if (game.gameSocket && game.gameSocket.readyState == WebSocket.OPEN){
					game.gameSocket.close(1000);
					game.gameSocket = undefined;
				}
				PongGame.gameReady = false;
				PongGame.WINNER_NAME = "";
			}
		}
		this.setGameSocket();
	}

	createFrontend(data){
		$("#_onGame").toggleClass("d-none d-flex");
		$("#leftTheGameBtn").text(["Teslim Ol", "Surrender", "Aufgeben"][["tr", "en", "de"].indexOf(chat.getCookie("language"))]);
		$("#leftTheGameBtn").off("click");
		$("#leftTheGameBtn").attr("data-bs-toggle", "modal");
		$("#leftTheGameBtn").attr("data-bs-target", "#surrenderModal");
	
		if (data.p1_uid == ownUid){
			$("#player1 h4").text(data.p2_displayname);
			$("#player1 img").attr("src", data.p2_thumbnail);
			$("#player2 h4").text(data.p1_displayname);
			$("#player2 img").attr("src", data.p1_thumbnail);
			this.yourOriginalSide = "left";
		}else{
			$("#player1 h4").text(data.p1_displayname);
			$("#player1 img").attr("src", data.p1_thumbnail);
			$("#player2 h4").text(data.p2_displayname);
			$("#player2 img").attr("src", data.p2_thumbnail);
			this.yourOriginalSide = "right";
		}
		this.startGame();
	}

	sendGameMessage(mode, message){
		if (this.gameSocket != undefined && this.gameSocket.readyState === WebSocket.OPEN)
			this.gameSocket.send(JSON.stringify({"mode": mode, "message": message }));
	}
	
	calcTimeDelta(time){
		const _time = new Date(time).getTime();
		const now = Date.now();
	
		const delta = now - _time;
		this.pong.serverDelta = delta;
		this.pong.Counter(delta);
		//console.log("timeNow:" + now + " recievedTime:" + _time + " delta:" + delta);
	}

	isGoal(buffer, message){
		if (buffer.oldscore1 != buffer.score1 || buffer.oldscore2 != buffer.score2){
			this.pong.reset();
			this.PongGame.powerup.reset();
			this.pong.resetDeathRound(message.lrs);
		}
	}

	updateBuffer(message){
		this.buffer.oldscore1 = this.buffer.score1;
		this.buffer.oldscore2 = this.buffer.score2;
		this.buffer.score1 = message.s1;
		this.buffer.score2 = message.s2;
		this.isGoal(this.buffer, message);
	}

	createGameSocket(){
		let _host = siteUrl.replace(/^https?:\/\//, '');
		//_host = _host.replace(/:8000$/, ':3000');
	
		this.gameSocket = new WebSocket(`wss://${_host}:3000/ws/game/${chat.matchStatus.game_uuid}/${chat.getCookie("token")}/`);
		this.gameSocket.onopen = function(e) {
			game.sendGameMessage("getTimeStamp", "");
			//sendGameMessage("getLastRoundStartTime", "");
			console.log('Game socket opened');
		}
		this.gameSocket.onclose = function(e) {
			console.log('Game socket closed');
		}
		this.gameSocket.onmessage = function(e) {
			const data = JSON.parse(e.data);
			if (data.message.surrender){
				console.log("yourOriginalSide: " + yourOriginalSide);
				game.pong.forcedWin = true;
				game.pong.forcedWinName = data.message.surrender.winnerName;
				game.pong.won = true;
				game.pong.finishGame();
			}else if (data.message.x && game.pong != undefined){
				game.pong.wait = false;
				game.pong.ball.y = data.message.y * game.pong.ratio;
				game.pong.ball.speedY = data.message.vY;
				game.pong.frameCount = data.message.fc;
				if (data.message.lrs){
					console.log(game.PongGame);
					game.PongGame.lastRoundStartTime = new Date(data.message.lrs).getTime();
					//PongGame.stopDeathRound = false;
				}
				if (data.message.maxV)
					game.pong.ball.MAX_SPEED = data.message.maxV;
				if (game.yourOriginalSide == "left"){
					game.pong.leftPaddle.y = data.message.p2 * game.pong.ratio;
					game.pong.rightPaddle.y = data.message.p1 * game.pong.ratio;
					game.pong.score1 = data.message.s2;
					game.pong.score2 = data.message.s1;
					game.updateBuffer(data.message);
					game.pong.ball.x = game.pong.canvasWidth - data.message.x * game.pong.ratio;
					game.pong.ball.speedX = -(data.message.vX);
				}else{
					game.pong.leftPaddle.y = data.message.p1 * game.pong.ratio;
					game.pong.rightPaddle.y = data.message.p2 * game.pong.ratio;
					game.pong.score1 = data.message.s1;
					game.pong.score2 = data.message.s2;
					game.updateBuffer(data.message);
					game.pong.ball.x = data.message.x * game.pong.ratio;
					game.pong.ball.speedX = data.message.vX;
				}
			}
			else if (data.message.wait && game.pong != undefined){
				game.pong.wait = true;
				game.pong.putLostConnection(data.message)
			}
			else if (data.message.end){
				if (game.yourOriginalSide == "left"){
					game.pong.score1 = data.message.end.s2;
					game.pong.score2 = data.message.end.s1;
				}else{
					game.pong.score1 = data.message.end.s1;
					game.pong.score2 = data.message.end.s2;
				}
				if (data.message.end.winner)
					game.pong.forcedWinName = data.message.end.winner;
				game.pong.won = true;
				if (data.message.end.semiMatchsFinished != -1)
					chat.semiMatchsFinished(data.message.end.semiMatchsFinished);
				game.pong.finishGame();
			}else if (data.message.getTimeStamp){
				game.calcTimeDelta(data.message.getTimeStamp);
			}
			else if (data.message.powerUp){
				game.PongGame.powerup.y = data.message.powerUp.y;
				if (game.yourOriginalSide == "left")
					game.PongGame.powerup.x = 1400 - data.message.powerUp.x;
				else
					game.PongGame.powerup.x = data.message.powerUp.x;
				game.PongGame.powerup.type = data.message.powerUp.type;
				game.PongGame.powerup.borderColor = data.message.powerUp.borderColor;
			}
			else if (data.message.powerUpUD){
				console.log("Before PowerUP Data: ballSpeedX:" + game.pong.ball.speedX + " ballSpeedY:" + game.pong.ball.speedY + " ballMaxV:" + game.pong.ball.MAX_SPEED + " ballRadius:" + game.pong.ball.radius + " leftPaddleHeight:" + game.pong.leftPaddle.height + " rightPaddleHeight:" + game.pong.rightPaddle.height);
				game.pong.ball.MAX_SPEED = data.message.powerUpUD.ballMaxV;
				game.pong.ball.radius = data.message.powerUpUD.ballRadius * game.pong.ratio;
				game.pong.ball.speedY = data.message.powerUpUD.ballVelY * game.pong.ratio;
				if (game.yourOriginalSide == "left"){
					game.pong.ball.speedX =  -1 * (data.message.powerUpUD.ballVelX * game.pong.ratio);
					game.pong.leftPaddle.height = data.message.powerUpUD.p2PaddleHeight * game.pong.ratio;
					game.pong.rightPaddle.height = data.message.powerUpUD.p1PaddleHeight * game.pong.ratio;
				}else{
					game.pong.leftPaddle.height = data.message.powerUpUD.p1PaddleHeight * game.pong.ratio;
					game.pong.rightPaddle.height = data.message.powerUpUD.p2PaddleHeight * game.pong.ratio;
					game.pong.ball.speedX = data.message.powerUpUD.ballVelX * game.pong.ratio;
				}
				game.PongGame.powerup.active = data.message.powerUpUD.active;
				console.log("After PowerUP Data: ballSpeedX:" + game.pong.ball.speedX + " ballSpeedY:" + game.pong.ball.speedY + " ballMaxV:" + game.pong.ball.MAX_SPEED + " ballRadius:" + game.pong.ball.radius + " leftPaddleHeight:" + game.pong.leftPaddle.height + " rightPaddleHeight:" + game.pong.rightPaddle.height);
			}
			else if (data.message.powerUpDestroy){
				game.PongGame.powerup.destroy();
			}
			else if (data.message.lrs){
				game.PongGame.lastRoundStartTime = new Date(data.message.lrs).getTime();
				//PongGame.stopDeathRound = false;
			}
			else if (data.message.semiMatchsFinished){
				chat.semiMatchsFinished(data.message.semiMatchsFinished);
			}
		}
	}

	setGameSocket() {
		if (document.querySelector("#urlObject").getAttribute("data-href") == "/viewApi/game" && (this.gameSocket == undefined || (this.gameSocket != undefined && this.gameSocket.readyState !== WebSocket.OPEN))) {
			console.log("SET GAME SOCKET gameSocket:" + this.gameSocket);
			setTimeout(function() {chat.sendMessage("isInMatch", "");}, 500);
		}else{
			if (this.matchStatus != undefined) {
				chat.sendMessage("closeMatch", "");
				this.matchStatus = undefined;
			}
			if (this.gameSocket != undefined && this.gameSocket.readyState === WebSocket.OPEN) {
				console.log("MUTATION OBSERVER CLOSING GAMESOCKET");
				this.gameSocket.close();
				this.gameSocket = undefined;
				if (this.pong)
					delete this.pong;
				this.PongGame.gameReady = false;
			}
		}
	
		
	}

	startGame(){
		console.log("***************Game Started***************");
		let navbarHeight =  $(".fixed-top").height();
		let wHeight = window.innerHeight;
		let gameWidth = wHeight - navbarHeight - (wHeight / 10);
		gameWidth = Math.floor(gameWidth);
		if (gameWidth + 100 > window.innerWidth){
			let wWidth = window.innerWidth;
			gameWidth = wWidth - (wWidth / 10);
		}
		$("#onGame").css("width", gameWidth.toString() + "px");
	
		this.pong = new this.PongGame(gameWidth, Math.floor(gameWidth / 14 * 10));
		console.log("PONGGAME OBJECT CREATED");
		window.addEventListener("resize", ()=>{
			if (!this.pong)
				return;
			let navbarHeight =  $(".fixed-top").height();
			let wHeight = window.innerHeight;
			let gameWidth = wHeight - navbarHeight - (wHeight / 10);
			gameWidth = Math.floor(gameWidth);
			if (gameWidth + 100 > window.innerWidth){
				let wWidth = window.innerWidth;
				gameWidth = wWidth - (wWidth / 10);
			}
			$("#onGame").css("width", gameWidth.toString() + "px");
			this.pong.resize(gameWidth);
		});
		document.addEventListener("visibilitychange", function() {
			if (document.visibilityState == "visible") {
				game.sendGameMessage("getLastRoundStartTime", "");
				console.log("GET LAST ROUND START TİME");
			}
		});
		if (this.pong.start("normal")){
			console.log("DELETING PONG");
			Game.PongGame.gameReady = false;
			delete this.pong;
		}
	}
}

/********************************************************PONG JS***********************************************************************/