class LocalGame{
	constructor(){
		this.pong = undefined;
		this.switch = false;
		this.gameType = "game";
		this.gamemode = "classic";
		this.bigBall = new Image();
		this.smallBall = new Image();
		this.bigPaddle = new Image();
		this.smallPaddle = new Image();
		this.rabbit = new Image();
		this.turtle = new Image();

		this.rabbit.src = "/static/img/rabbit.png";
		this.turtle.src = "/static/img/turtle.png";
		this.smallBall.src = "/static/img/smallBall.png";
		this.bigBall.src = "/static/img/bigBall.png";
		this.smallPaddle.src = "/static/img/smallPaddle.png";
		this.bigPaddle.src = "/static/img/bigPaddle.png";

		this.imageList = [this.bigBall, this.smallBall, this.bigPaddle, this.smallPaddle, this.rabbit, this.turtle];

		this.rabbit.onload = function(){
		}
		this.turtle.onload = function(){
		}
		this.smallBall.onload = function(){
		}
		this.bigBall.onload = function(){
		}
		this.smallPaddle.onload = function(){
		}
		this.bigPaddle.onload = function(){
		}

		this.players = {
			player1: "",
			player2: "",
			player3: "",
			player4: ""
		};

		this.matchs = {
			match1: {
				player1: "",
				player2: "",
				score1: 0,
				score2: 0
			},
			match2: {
				player1: "",
				player2: "",
				score1: 0,
				score2: 0
			},
			thirdPlaceMatch: {
				player1: "",
				player2: "",
				score1: 0,
				score2: 0
			},
			finalMatch: {
				player1: "",
				player2: "",
				score1: 0,
				score2: 0
			}
		};

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

			static WINNING_SCORE = 3;
			static WINNER_NAME = "";
			static stopDeathRound = false;
			static isGoal = false;
			static gameReady = false;

			static powerup = {
				radius: 40,
				x : 0,
				y: 0,
				type: 0,
				borderColor: PongGame.NO_COLOR,
				active: 0,

				draw() {
					console.log("Powerup çiziyom");
					localGame.pong.context.fillStyle = this.borderColor == PongGame.RED  ? '#ff0000' : this.borderColor == PongGame.GREEN  ? '#00cc00' : '#333333';
					localGame.pong.context.beginPath();
					localGame.pong.context.arc(this.x * localGame.pong.ratio, this.y * localGame.pong.ratio, this.radius * localGame.pong.ratio, 0, Math.PI * 2);
					localGame.pong.context.fill();
					localGame.pong.context.drawImage(localGame.imageList[this.type - 1], (this.x - this.radius) * localGame.pong.ratio, (this.y - this.radius) * localGame.pong.ratio, this.radius * 2 * localGame.pong.ratio, this.radius * 2 * localGame.pong.ratio);
				},

				destroy() {
					this.borderColor = PongGame.NO_COLOR;
					this.x = 0;
					this.y = 0;
					this.type = 0;
					this.active = 0;
				},

				reset(){
					localGame.pong.ball.MAX_SPEED = 15.0;
					localGame.pong.ball.radius = 20.0 * localGame.pong.ratio;
					localGame.pong.leftPaddle.height = 200 * localGame.pong.ratio;
					localGame.pong.rightPaddle.height = 200 * localGame.pong.ratio;
					this.destroy();
					localGame.pong.lastPowerUpTime = Date.now();
				},

				generate(){
					console.log("GENERATEEEEEEEEEEEEEE");
					this.x = Math.round(Math.random() * (500 * localGame.pong.ratio)) + (450 * localGame.pong.ratio);
					this.y = Math.round(Math.random() * ((1400 * localGame.pong.ratio) - (2 * this.radius * localGame.pong.ratio))) + (this.radius * localGame.pong.ratio);
					this.type = Math.round(Math.random() * 5) + 1;
					this.borderColor =  (this.type == 3 || this.type == 4) ? Math.round(Math.random()) + 1 : PongGame.NO_COLOR;
				},

				deactivate(){
					localGame.pong.ball.MAX_VEL = 15.0;
					localGame.pong.ball.radius = 20.0 * localGame.pong.ratio;
					if (this.type == PongGame.FAST_BALL){
						localGame.pong.ball.speedX = (localGame.pong.ball.speedX / 4.0) * 3.0;
						localGame.pong.ball.speedY = (localGame.pong.ball.speedY / 4.0) * 3.0;
					}else if (this.type == PongGame.SLOW_BALL){
						localGame.pong.ball.speedX = (localGame.pong.ball.speedX / 3.0) * 4.0;
						localGame.pong.ball.speedY = (localGame.pong.ball.speedY / 3.0) * 4.0;
					}
					localGame.pong.leftPaddle.height = 200 * localGame.pong.ratio;
					localGame.pong.rightPaddle.height = 200 * localGame.pong.ratio;
					localGame.lastEffectedPlayer = -1;
					this.destroy();
				},
				/*
				static BIG_BALL = 1;
				static SMALL_BALL = 2;
				static BIG_PADDLE = 3;
				static SMALL_PADDLE = 4;
				static FAST_BALL = 5;
				static SLOW_BALL = 6;
				static NO_COLOR = 0;
				static RED = 1;
				static GREEN = 2;
				*/
				activate(){
					console.log("ACTİVATEEEEEEEEEEE");
					if (this.type == PongGame.BIG_BALL)
						localGame.pong.ball.radius += 10 * localGame.pong.ratio;
					else if (this.type == PongGame.SMALL_BALL)
						localGame.pong.ball.radius -= 10 * localGame.pong.ratio;
					else if (this.type == PongGame.BIG_PADDLE){
						if (this.borderColor == PongGame.RED){
							if (localGame.pong.lastTouchedPlayer == 1){
								localGame.pong.lastEffectedPlayer = 2;
								localGame.pong.rightPaddle.height += 50 * localGame.pong.ratio;
							}else if (localGame.pong.lastTouchedPlayer == 2){
								localGame.pong.lastEffectedPlayer = 1;
								localGame.pong.leftPaddle.height += 50 * localGame.pong.ratio;
							}
						}else if (this.borderColor == PongGame.GREEN){
							if (localGame.pong.lastTouchedPlayer == 1){
								localGame.pong.lastEffectedPlayer = 1;
								localGame.pong.leftPaddle.height += 50 * localGame.pong.ratio;
							}else if (localGame.pong.lastTouchedPlayer == 2){
								localGame.pong.lastEffectedPlayer = 2;
								localGame.pong.rightPaddle.height += 50 * localGame.pong.ratio;
							}
						}
					}else if (this.type == PongGame.SMALL_PADDLE){
						if (this.borderColor == PongGame.RED){
							if (localGame.pong.lastTouchedPlayer == 1){
								localGame.pong.lastEffectedPlayer = 1;
								localGame.pong.leftPaddle.height -= 50 * localGame.pong.ratio;
							}else if (localGame.pong.lastTouchedPlayer == 2){
								localGame.pong.lastEffectedPlayer = 2;
								localGame.pong.rightPaddle.height -= 50 * localGame.pong.ratio;
							}
						}else if (this.borderColor == PongGame.GREEN){
							if (localGame.pong.lastTouchedPlayer == 1){
								localGame.pong.lastEffectedPlayer = 2;
								localGame.pong.rightPaddle.height -= 50 * localGame.pong.ratio;
							}else if (localGame.pong.lastTouchedPlayer == 2){
								localGame.pong.lastEffectedPlayer = 1;
								localGame.pong.leftPaddle.height -= 50 * localGame.pong.ratio;
							}
						}
					}else if (this.type == PongGame.FAST_BALL){
						localGame.pong.ball.MAX_SPEED += 5;
						localGame.pong.ball.speedX = (localGame.pong.ball.speedX / 3.0) * 4.0;
						localGame.pong.ball.speedY = (localGame.pong.ball.speedY / 3.0) * 4.0;
					}
					else if (this.type == PongGame.SLOW_BALL){
						localGame.pong.ball.MAX_SPEED -= 5;
						localGame.pong.ball.speedX = (localGame.pong.ball.speedX / 4.0) * 3.0;
						localGame.pong.ball.speedY = (localGame.pong.ball.speedY / 4.0) * 3.0;
					}
					this.active = 1;
					localGame.pong.lastPowerUpTime = Date.now() - 10000;
				}
			};

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
				this.lastFrame = 0;
				this.won = false;
				this.lastRoundStartTime = Date.now();
				this.lastPowerUpTime = Date.now();
				this.lastTouchedPlayer = -1;
				this.lastEffectedPlayer = -1;
				this.ball = {
					MAX_SPEED: 15.0,
					radius: 20.0 * this.ratio,
					speedX: Math.random() < 0.5 ? 15.0 : -15.0,
					speedY: (Math.random() - 0.5) * 15.0,
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
					},
					reset(oldRatio, ratio, canvasWidth, canvasHeight){
						this.x = 10 * ratio;
						this.y = (canvasHeight / 2) - ((200 * ratio) / 2);
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
					},
					reset(oldRatio, ratio, canvasWidth, canvasHeight){
						this.x = canvasWidth - (10 * ratio) - (6 * ratio);
						this.y = (canvasHeight / 2) - ((200 * ratio) / 2);
					}
				};

				this.keys = {
					38: false,
					40: false,
					87: false,
					83: false
				};
			}

			powerUpEffects(){
				console.log("POWERUP EFFECTS");
				console.log(Date.now());
				console.log("LRS BABY: " + this.lastPowerUpTime);;
				if (localGame.gamemode == "powerups"){
					if (Date.now() - this.lastPowerUpTime > 10000 && PongGame.powerup.active == 0 && PongGame.powerup.type == 0)
						PongGame.powerup.generate();
					else if (Date.now() - this.lastPowerUpTime > 20000 && PongGame.powerup.type != 0){
						if (PongGame.powerup.active == 1){
							PongGame.powerup.deactivate();
							this.lastPowerUpTime = Date.now();
						}else{
							PongGame.powerup.destroy();
							this.lastPowerUpTime = Date.now() - 10000;
						}
					}
				}
			}

			Counter(){
                let second = Date.now();
				//console.log("AYIRTEDİLEBİLİR gameStartTimestamp:" + gameStartTimestamp + " second:" + second + " deltaTime:" + deltaTime);
				let fk = () => {
					this.context.fillStyle = '#000000';
					this.context.fillRect(0,0, this.canvasWidth, this.canvasHeight);
					this.context.fillStyle = '#FFFFFF';
					this.context.font = `${50 * this.canvasWidth / 1400}px regular5x3`;
					this.context.textAlign = "center";
					this.context.fillText((5 - Math.floor((Date.now() - second) / 1000)).toString(), this.canvasWidth / 2, this.canvasHeight / 2);
					//console.log("second:" + second);
					if (Date.now() - second < 5000)
						requestAnimationFrame(fk);
					else{
						PongGame.gameReady = true;
						this.start("normal");
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

				if (PongGame.powerup.type != 0 && PongGame.powerup.active == 0){
					PongGame.powerup.draw();
				}
			}

			movePaddles(){
				let _data = {"u": Number(this.keys[38]), "d": Number(this.keys[40]), "w": Number(this.keys[87]), "s": Number(this.keys[83])};

				if (_data.u)
					this.rightPaddle.y -= this.rightPaddle.speed * this.ratio;
				if (_data.d)
					this.rightPaddle.y += this.rightPaddle.speed * this.ratio;
				if (_data.w)
					this.leftPaddle.y -= this.leftPaddle.speed * this.ratio;
				if (_data.s)
					this.leftPaddle.y += this.leftPaddle.speed * this.ratio;
				if (this.leftPaddle.y < 0 || this.leftPaddle.y > this.canvas.height - this.leftPaddle.height)
					this.leftPaddle.y = this.leftPaddle.y < 0 ? 0 : this.canvas.height - this.leftPaddle.height;
				if (this.rightPaddle.y < 0 || this.rightPaddle.y > this.canvas.height - this.rightPaddle.height)
					this.rightPaddle.y = this.rightPaddle.y < 0 ? 0 : this.canvas.height - this.rightPaddle.height;
			}

			initKeyboardEvents() {
				let keys = this.keys;
				document.addEventListener("keydown", function(e){
					if (e.keyCode in keys){
						keys[e.keyCode] = true;
					}
				});
				document.addEventListener("keyup", function(e){
					if (e.keyCode in keys){
						keys[e.keyCode] = false;
					}
				});
			}

			update() {
				console.log("GİRDİM ULAN");
				// Move ball
				this.ball.x = Number((this.ball.x + (this.ball.speedX * this.ratio)).toFixed(6));
				this.ball.y = Number((this.ball.y + (this.ball.speedY * this.ratio)).toFixed(6));
				// Check collision with walls
				if (this.ball.y + this.ball.radius >= this.canvasHeight){
					this.ball.speedY = -1 * Math.abs(this.ball.speedY);
					this.ifBoostedSpeedUpBall();
				}else if (this.ball.y - this.ball.radius <= 0){
					this.ball.speedY = Math.abs(this.ball.speedY);
					this.ifBoostedSpeedUpBall();
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
							this.lastTouchedPlayer = 1;
							this.ifBoostedSpeedUpBall();
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
							this.lastTouchedPlayer = 2;
							this.ifBoostedSpeedUpBall();
						}
					}
				}
				console.log("POWER KONTROL EDİYORUM");
				if (PongGame.powerup.type != 0 && PongGame.powerup.active == 0){
					console.log("TYPE != 0 ve ACTIVE == 0");
					console.log(this.ball);
					console.log(PongGame.powerup);
					if (this.ball.x + this.ball.radius >= (PongGame.powerup.x - PongGame.powerup.radius) * this.ratio && this.ball.x - this.ball.radius <= (PongGame.powerup.x + PongGame.powerup.radius) * this.ratio && this.ball.y + this.ball.radius >= (PongGame.powerup.y - PongGame.powerup.radius) * this.ratio && this.ball.y - this.ball.radius <= (PongGame.powerup.y + PongGame.powerup.radius) * this.ratio){
						console.log("ÇARPIŞMA GERÇEKLEŞTİ");
						if (localGame.gamemode == "powerups"){
							console.log("POWERUP MODEDA");
							PongGame.powerup.activate();
						}
					}
				}
			}

			ifBoostedSpeedUpBall(){
				if (localGame.gamemode == "boosted"){
					this.ball.MAX_SPEED = (this.ball.MAX_SPEED / 100.0) * 101.5;
					this.ball.speedX = (this.ball.speedX / 100.0) * 101.5;
					this.ball.speedY = (this.ball.speedY / 100.0) * 101.5;
				}
			}

			reset() {
				this.ball.x = this.canvasWidth / 2;
				this.ball.y = this.canvasHeight / 2;
				this.ball.speedX = Math.random() < 0.5 ? 15.0 : -15.0;
				this.ball.speedY = (Math.random() - 0.5) * 15.0;
				this.leftPaddle.reset(this.oldRatio, this.ratio, this.canvasWidth, this.canvasHeight);
				this.rightPaddle.reset(this.oldRatio, this.ratio, this.canvasWidth, this.canvasHeight);
				//reset Timestamps
				this.lastRoundStartTime = Date.now();
				this.lastPowerUpTime = this.lastRoundStartTime;
				this.lastTouchedPlayer = -1;
				this.lastEffectedPlayer = -1;
			}

			resetDeathRound(){
				$(this.canvas).css("position", "static");
				$(this.canvas).css("box-shadow", "none");
				$(this.canvas).css("z-index", "0");
				$(this.canvas).css("transform", `rotate(0deg)`);
				PongGame.stopDeathRound = true;
			}

			deathRound(deg)
			{
				$(this.canvas).css("transform", `rotate(${deg.toString()}deg)`);
			}

			start(mode) {
				if (mode == "normal"){
					if (!PongGame.gameReady)
						return 0;
					//KLAVYE ve simule
					this.initKeyboardEvents();
					this.lastRoundStartTime = Date.now();
					this.lastPowerUpTime = this.lastRoundStartTime;
				}
				let loop = () => {
					if (localGame.switch == true){
						PongGame.powerup.reset();
						return (1);
					}
					this.update();
					this.draw();
					this.movePaddles();
					this.scoreCheck();
					this.powerUpEffects();
					//console.log("LastRoundStartTime:" + PongGame.lastRoundStartTime);
                    //ŞAİBELİ NOKTALAR
					if (PongGame.lastRoundStartTime < 0){
						$(this.canvas).css("position", "absolute");
						$(this.canvas).css("box-shadow", "0px 0px 0px 3000px rgb(0 0 0 / 90%)");
						$(this.canvas).css("z-index", "10000");
						let tmp = -1 * (PongGame.lastRoundStartTime + (1000 * 60));
						let deg = ((tmp * (1 + (0.1 * (tmp / 5000.0))) / 15000.0) * 360.0);
						this.deathRound(deg);
					}
					if (!this.won && this.score1 < PongGame.WINNING_SCORE && this.score2 < PongGame.WINNING_SCORE){
						requestAnimationFrame(loop);
					}else{
						this.won = true;
						PongGame.WINNER_NAME = this.score1 > this.score2 ? $("#p1Username").text() : $("#p2Username").text();
						if (localGame.gameType == "tournament"){
							localGame.fillNextScore({"score1": this.score1, "score2": this.score2});
							if (localGame.matchs.finalMatch.score1 == 0 && localGame.matchs.finalMatch.score2 == 0)
								$("#nextMatchBtn").toggleClass("d-none");
							else {
								localGame.drawTournamentStandings();
								localGame.gameType = "game";
								$("#showOrderBtn").click();
								$("#leftTheGameBtn").click();
							}
						}
						this.finishGame();
					}
				}
				requestAnimationFrame(loop);
				PongGame.powerup.reset();
				return (1);
			}

			scoreCheck(){
				if (this.ball.x - this.ball.radius > this.canvasWidth){
					this.score1++;
					this.reset();
					PongGame.powerup.reset();
					PongGame.isGoal = true;
				}else if (this.ball.x + this.ball.radius < 0){
					this.score2++;
					this.reset();
					PongGame.powerup.reset();
					PongGame.isGoal = true;
				}
			}

			finishGame(semiMatchsFinished = false){
				console.log("localGame over");
				this.resetDeathRound();
				// Game over
				requestAnimationFrame(() => {
					this.context.fillStyle = '#000000';
					this.context.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
					this.context.fillStyle = '#ffffff';
					this.context.font = `${50 * this.ratio}px regular5x3`;
					this.context.textAlign = "center";
					this.context.fillText(`${PongGame.WINNER_NAME} wins!`, this.canvasWidth / 2, this.canvasHeight / 2);

					$("#leftTheGameBtn").text(["Geri", "Back", "Zurück"][["tr", "en", "de"].indexOf(localGame.getCookie("language"))]);
				});
				PongGame.gameReady = false;
			}
		}

		$("#leftTheGameBtn").on("click", ()=>{
			$("#selectGameInterface").toggleClass("d-none d-flex");
			$("#selectGameInterface input").val("");
			$("#onGame").toggleClass("d-none d-flex");
			this.matchs = {
				match1: { player1: "", player2: "", score1: 0, score2: 0 },
				match2: { player1: "", player2: "", score1: 0, score2: 0 },
				thirdPlaceMatch: { player1: "", player2: "", score1: 0, score2: 0},
				finalMatch: { player1: "", player2: "", score1: 0, score2: 0}
			};
			this.players = { player1: "", player2: "", player3: "", player4: "" };
			this.PongGame.powerup.reset();
			this.pong = undefined;
			this.switch = true;
		});
		$("#nextMatchBtn").on("click", ()=>{
			if (this.matchs.finalMatch.score1 != 0 || this.matchs.finalMatch.score2 != 0)
				;
			else if (this.matchs.thirdPlaceMatch.score1 != 0 || this.matchs.thirdPlaceMatch.score2 != 0)
				this.createFrontend({"p1": this.matchs.finalMatch.player1, "p2": this.matchs.finalMatch.player2, "matchText": ["Final Maç", "Final Match", "Finale"][["tr", "en", "de"].indexOf(localGame.getCookie("language"))]});
			else if (this.matchs.match2.score1 != 0 || this.matchs.match2.score2 != 0){
				this.matchs.finalMatch.player1 = this.matchs.match1.score1 > this.matchs.match1.score2 ? this.matchs.match1.player1 : this.matchs.match1.player2;
				this.matchs.finalMatch.player2 = this.matchs.match2.score1 > this.matchs.match2.score2 ? this.matchs.match2.player1 : this.matchs.match2.player2;
				this.matchs.thirdPlaceMatch.player1 = this.matchs.match1.score1 < this.matchs.match1.score2 ? this.matchs.match1.player1 : this.matchs.match1.player2;
				this.matchs.thirdPlaceMatch.player2 = this.matchs.match2.score1 < this.matchs.match2.score2 ? this.matchs.match2.player1 : this.matchs.match2.player2;
				this.createFrontend({"p1": this.matchs.thirdPlaceMatch.player1, "p2": this.matchs.thirdPlaceMatch.player2, "matchText": ["Üçüncülük Maçı", "Third Place Match", "Spiel um den dritten Platz"][["tr", "en", "de"].indexOf(localGame.getCookie("language"))]});
			}
			else if (this.matchs.match1.score1 != 0 || this.matchs.match1.score2 != 0)
				this.createFrontend({"p1": this.matchs.match2.player1, "p2": this.matchs.match2.player2, "matchText": ["Maç 2", "Match 2", "Spiel 2"][["tr", "en", "de"].indexOf(localGame.getCookie("language"))]});
			$("#nextMatchBtn").toggleClass("d-none");
		});
		$("#onlyMatch").on("click", ()=>{
			this.switch = false;
			let player1 = $("#player1Name").val();
			let player2 = $("#player2Name").val();
			this.gamemode = $("#modes1 option:selected").val();
			if (player1 == "" || player2 == "")
				alert("Please enter player names!");
			else if (player1 == player2)
				alert("Please enter different names!");
			else if (player1.length > 20 || player2.length > 20)
				alert("Please enter shorter names!");
			else{
				$("#selectGameInterface").toggleClass("d-none d-flex");
				$("#onGame").toggleClass("d-none d-flex");
				this.createFrontend({"p1": player1, "p2": player2});
			}
		});
		$("#tournamentCreate").on("click", ()=>{
			this.gameType = "tournament";
			this.switch = false;
			let player1 = $("#playerT1Name").val();
			let player2 = $("#playerT2Name").val();
			let player3 = $("#playerT3Name").val();
			let player4 = $("#playerT4Name").val();
			this.gamemode = $("#modes2 option:selected").val();
			if (player1 == "" || player2 == "" || player3 == "" || player4 == "")
				alert("Please enter player names!");
			else if (player1 == player2 || player1 == player3 || player1 == player4 || player2 == player3 || player2 == player4 || player3 == player4)
				alert("Please enter different names!");
			else if (player1.length > 20 || player2.length > 20 || player3.length > 20 || player4.length > 20)
				alert("Please enter shorter names!");
			else {
				$("#selectGameInterface").toggleClass("d-none d-flex");
				$("#onGame").toggleClass("d-none d-flex");
				this.players.player1 = player1;
				this.players.player2 = player2;
				this.players.player3 = player3;
				this.players.player4 = player4;
				this.matchMaker();
				this.createFrontend({"p1": this.matchs.match1.player1, "p2": this.matchs.match1.player2, "matchText": ["Maç 1", "Match 1", "Spiel 1"][["tr", "en", "de"].indexOf(localGame.getCookie("language"))]});
			}
		});
	}

	fillModalTournamentOrder(order){
		console.log(order);
		$("#tournamentOrderModal .modal-body").html("");
        $("#tournamentOrderModal .modal-body").append(
            $("<div>").append($("<h4>").text(["Kazanan : ", "Winner: ", "Gewinner: "][["tr", "en", "de"].indexOf(localGame.getCookie("language"))] + order[0])),
            $("<div>").append($("<h4>").text(["İkinci  : ", "Second: ", "Zweite  : "][["tr", "en", "de"].indexOf(localGame.getCookie("language"))] + order[1])),
            $("<div>").append($("<h4>").text(["Üçüncü  : ", "Third : ", "Dritte  : "][["tr", "en", "de"].indexOf(localGame.getCookie("language"))] + order[2])),
            $("<div>").append($("<h4>").text(["Dördüncü: ", "Fourth: ", "Vierte  : "][["tr", "en", "de"].indexOf(localGame.getCookie("language"))] + order[3])),
        );
    }

	drawTournamentStandings(){
		//ORDER
		let order = [this.matchs.finalMatch.score1 > this.matchs.finalMatch.score2 ? this.matchs.finalMatch.player1 : this.matchs.finalMatch.player2,
			this.matchs.finalMatch.score1 < this.matchs.finalMatch.score2 ? this.matchs.finalMatch.player1 : this.matchs.finalMatch.player2,
			this.matchs.thirdPlaceMatch.score1 > this.matchs.thirdPlaceMatch.score2 ? this.matchs.thirdPlaceMatch.player1 : this.matchs.thirdPlaceMatch.player2,
			this.matchs.thirdPlaceMatch.score1 < this.matchs.thirdPlaceMatch.score2 ? this.matchs.thirdPlaceMatch.player1 : this.matchs.thirdPlaceMatch.player2];
		this.fillModalTournamentOrder(order);
	}

	fillNextScore(scores){
		if (this.matchs.match1.score1 == 0 && this.matchs.match1.score2 == 0){
			this.matchs.match1.score1 = scores.score1;
			this.matchs.match1.score2 = scores.score2;
		}else if (this.matchs.match2.score1 == 0 && this.matchs.match2.score2 == 0){
			this.matchs.match2.score1 = scores.score1;
			this.matchs.match2.score2 = scores.score2;
		}else if (this.matchs.thirdPlaceMatch.score1 == 0 && this.matchs.thirdPlaceMatch.score2 == 0){
			this.matchs.thirdPlaceMatch.score1 = scores.score1;
			this.matchs.thirdPlaceMatch.score2 = scores.score2;
		}else if (this.matchs.finalMatch.score1 == 0 && this.matchs.finalMatch.score2 == 0){
			this.matchs.finalMatch.score1 = scores.score1;
			this.matchs.finalMatch.score2 = scores.score2;
		}else
			console.log("ERROR: fillNextScore");
	}

	matchMaker() {
		let _players = [this.players.player1, this.players.player2, this.players.player3, this.players.player4];
		for (let i = _players.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * i);
			[_players[i], _players[j]] = [_players[j], _players[i]];
		}
		this.matchs.match1.player1 = _players[0];
		this.matchs.match1.player2 = _players[1];
		this.matchs.match2.player1 = _players[2];
		this.matchs.match2.player2 = _players[3];
	}

	createFrontend(data){
		$("#player1 h4").text(data.p1);
		if (data.matchText){
			$("#matchText").text(data.matchText)
			if ($("#matchText").hasClass("d-none"))
				$("#matchText").toggleClass("d-none")
		}
		else{
			$("#matchText").text("");
			if (!$("#matchText").hasClass("d-none"))
				$("#matchText").toggleClass("d-none")
		}
		$("#player2 h4").text(data.p2);
		this.startGame();
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
		this.pong.Counter();
	}

	getCookie(cname) {
		let name = cname + "=";
		let decodedCookie = decodeURIComponent(document.cookie);
		let ca = decodedCookie.split(';');
		for(let i = 0; i <ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) == ' ')
				c = c.substring(1);
			if (c.indexOf(name) == 0)
				return c.substring(name.length, c.length);
		}
		return "";
	}
}
/********************************************************LocalGame JS***********************************************************************/
