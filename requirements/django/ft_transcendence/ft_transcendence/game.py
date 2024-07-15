from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import time
import asyncio
import random
from datetime import datetime, timedelta


class MyClock:
	def __init__(self, ticks_per_second):
		self.ticks_per_second = ticks_per_second
		self.tick_duration = 1 / ticks_per_second
		self.last_tick_time = time.time()

	async def tick(self):
		current_time = time.time()
		elapsed_time = current_time - self.last_tick_time
		sleep_time = self.tick_duration - elapsed_time

		if sleep_time > 0:
			await asyncio.sleep(sleep_time)
		else:
			self.last_tick_time = current_time

		self.last_tick_time += self.tick_duration


WIDTH, HEIGHT = 1400, 1000

FPS = 60

WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

PADDLE_WIDTH, PADDLE_HEIGHT = 6, 200
BALL_RADIUS = 20

WINNING_SCORE = 3

class PowerUp:
	BIG_BALL = 1
	SMALL_BALL = 2
	BIG_PADDLE = 3
	SMALL_PADDLE = 4
	FAST_BALL = 5
	SLOW_BALL = 6
	#HIDDEN_PADDLE = 7 belki bakarız

	NO_COLOR = 0
	RED = 1
	GREEN = 2

	def __init__(self, room_name):
		self.activated = False
		self.x = 0
		self.y = 0
		self.type = 0
		self.radius = 40
		self.borderColor = PowerUp.NO_COLOR
		self.room_name = room_name

	async def createPowerUp(self):
		self.x = random.randint(450 + self.radius, 950 - self.radius)
		self.y = random.randint(self.radius, HEIGHT - self.radius)
		self.type = random.randint(1, 6)
		self.borderColor = random.randint(1, 2) if self.type == 3 or self.type == 4 else PowerUp.NO_COLOR
		print("POWERUP CREATED")
		channel_layer = get_channel_layer()
		await channel_layer.group_send(self.room_name,
		{
			"type": "game.backend",
			"message": {
				"powerUp":
				{
					"x": self.x,
					"y": self.y,
					"type": self.type,
					"borderColor": self.borderColor
				}
			}
		})


	async def usePowerUp(self, game, activeState):
		channel_layer = get_channel_layer()
		await channel_layer.group_send(self.room_name,
		{
			"type": "game.backend",
			"message": {
				"powerUpUD": {
					"ballRadius": game.ball.radius,
					"ballMaxV": game.ball.MAX_VEL,
					"ballVelX": game.ball.x_vel,
					"ballVelY": game.ball.y_vel,
					"p1PaddleHeight": game.p1_paddle.height,
					"p2PaddleHeight": game.p2_paddle.height,
					"active": activeState
				}
			}
		})

	async def fakeDestroyPowerUp(self):
		channel_layer = get_channel_layer()
		await channel_layer.group_send(self.room_name,
		{
			"type": "game.backend",
			"message": {
				"powerUpDestroy": True
			}
		})

	async def destroyPowerUp(self):
		self.x = 0
		self.y = 0
		self.type = 0
		self.borderColor = PowerUp.NO_COLOR
		self.activated = False
		channel_layer = get_channel_layer()
		await channel_layer.group_send(self.room_name,
		{
			"type": "game.backend",
			"message": {
				"powerUpDestroy": True
			}
		})

	async def resetPowerUpEffect(self, game):
		await self.destroyPowerUp()
		game.lastPowerUpTime = datetime.now()
		game.ball.MAX_VEL = 15.0
		game.ball.radius = BALL_RADIUS
		game.p1_paddle.height = PADDLE_HEIGHT
		game.p2_paddle.height = PADDLE_HEIGHT

class Paddle:
	COLOR = WHITE
	VEL = 20

	def __init__(self, x, y, width, height):
		self.x = self.original_x = x
		self.y = self.original_y = y
		self.width = width
		self.height = height
		self.ballTouches = 0

	def move(self, up=1):
		if up == 1:
			if self.y - self.VEL >= 0:
				self.y -= self.VEL
			elif self.y - self.VEL < 0:
				self.y = 0
		else:
			if self.y + self.VEL + self.height <= HEIGHT:
				self.y += self.VEL
			elif self.y + self.VEL + self.height > HEIGHT:
				self.y = HEIGHT - self.height

	def reset(self):
		self.x = self.original_x
		self.y = self.original_y


class Ball:
	MAX_VEL = 15.0
	COLOR = WHITE

	def __init__(self, x, y, radius):
		self.x = self.original_x = x
		self.y = self.original_y = y
		self.radius = radius
		self.x_vel = list([-1, 1])[random.randint(0,1)] * self.MAX_VEL
		self.y_vel = random.uniform(-0.5, 0.5) * self.MAX_VEL

	def move(self):
		self.x = round(self.x + self.x_vel, 3)
		self.y = round(self.y + self.y_vel, 3)

	def reset(self):
		self.x = self.original_x
		self.y = self.original_y
		self.x_vel = list([-1, 1])[random.randint(0,1)] * self.MAX_VEL
		self.y_vel = random.uniform(-0.5, 0.5) * self.MAX_VEL

class PongGame:
	def __init__(self, startTime, room_name):
		self.lastPowerUpTime = startTime
		self.powerUp = PowerUp(room_name)
		self.p1_paddle =  Paddle(10, HEIGHT//2 - PADDLE_HEIGHT //
							2, PADDLE_WIDTH, PADDLE_HEIGHT)
		self.p2_paddle = Paddle(WIDTH - 10 - PADDLE_WIDTH, HEIGHT //
							2 - PADDLE_HEIGHT//2, PADDLE_WIDTH, PADDLE_HEIGHT)
		self.ball = Ball(WIDTH // 2, HEIGHT // 2, BALL_RADIUS)
		self.p1_score = 0
		self.p2_score = 0
		self.clock = MyClock(FPS)
		self.frameCounter = 0
		self.run = True
		self.won = False
		self.finishGame = False
		self.lastTouchedPlayer = 0
		self.lastEffectedPlayer = 0
		self.keys = {"player1Up":0,
				"player1Down":0,
				"player2Up":0,
				"player2Down":0}
		self.hitThePaddle = False
		self.catchedPowerUps = 0
		self.surrend = False

	def ifBoostedSpeedUpBall(self, gameMode):
		if gameMode == "boosted":
			self.ball.MAX_VEL = (self.ball.MAX_VEL / 100.0) * 101.5
			self.ball.x_vel = (self.ball.x_vel / 100.0) * 101.5
			self.ball.y_vel = (self.ball.y_vel / 100.0) * 101.5

	async def handle_collision(self, gameMode):
		if self.ball.y + self.ball.radius >= HEIGHT:
			self.ball.y_vel = -1 * abs(self.ball.y_vel)
			self.ifBoostedSpeedUpBall(gameMode)
		elif self.ball.y - self.ball.radius <= 0:
			self.ball.y_vel = abs(self.ball.y_vel)
			self.ifBoostedSpeedUpBall(gameMode)
		if self.ball.x_vel < 0:
			if self.ball.y + self.ball.radius >= self.p1_paddle.y and self.ball.y - self.ball.radius <= self.p1_paddle.y + self.p1_paddle.height:
				if self.ball.x - self.ball.radius <= self.p1_paddle.x + self.p1_paddle.width:
					self.ball.x_vel = abs(self.ball.x_vel)
					middle_y = self.p1_paddle.y + self.p1_paddle.height / 2
					difference_in_y = middle_y - self.ball.y
					reduction_factor = (self.p1_paddle.height / 2) / self.ball.MAX_VEL
					y_vel = difference_in_y / reduction_factor
					self.ball.y_vel = round(-1 * y_vel, 3)
					self.lastTouchedPlayer = 1
					self.ifBoostedSpeedUpBall(gameMode)
					self.hitThePaddle = True
					self.p1_paddle.ballTouches += 1
		else:
			if self.ball.y + self.ball.radius >= self.p2_paddle.y and self.ball.y - self.ball.radius <= self.p2_paddle.y + self.p2_paddle.height:
				if self.ball.x + self.ball.radius >= self.p2_paddle.x:
					self.ball.x_vel = -1 * abs(self.ball.x_vel)
					middle_y = self.p2_paddle.y + self.p2_paddle.height / 2
					difference_in_y = middle_y - self.ball.y
					reduction_factor = (self.p2_paddle.height / 2) / self.ball.MAX_VEL
					y_vel = difference_in_y / reduction_factor
					self.ball.y_vel = round(-1 * y_vel, 3)
					self.lastTouchedPlayer = 2
					self.ifBoostedSpeedUpBall(gameMode)
					self.hitThePaddle = True
					self.p2_paddle.ballTouches += 1
		if self.powerUp.type != 0 and not self.powerUp.activated:
			if self.ball.x + self.ball.radius >= self.powerUp.x - self.powerUp.radius and self.ball.x - self.ball.radius <= self.powerUp.x + self.powerUp.radius and \
				self.ball.y + self.ball.radius >= self.powerUp.y - self.powerUp.radius and self.ball.y - self.ball.radius <= self.powerUp.y + self.powerUp.radius:
					if (gameMode == "powerups"):
						await self.activatePowerUp()
						self.catchedPowerUps += 1


	def handle_paddle_movement(self):
		if self.keys["player1Up"] == 1:
			self.p1_paddle.move(up=1)
		if self.keys["player1Down"] == 1:
			self.p1_paddle.move(up=0)
		if self.keys["player2Up"] == 1:
			self.p2_paddle.move(up=1)
		if self.keys["player2Down"] == 1:
			self.p2_paddle.move(up=0)

	async def scoreCheck(self, lastRoundChanged):
		if self.ball.x < 0 and not self.hitThePaddle:
			self.p2_score += 1
			await self.powerUp.resetPowerUpEffect(self)
			self.ball.reset()
			self.p1_paddle.reset()
			self.p2_paddle.reset()
			return True, datetime.now()
		elif self.ball.x > WIDTH and not self.hitThePaddle:
			self.p1_score += 1
			await self.powerUp.resetPowerUpEffect(self)
			self.ball.reset()
			self.p1_paddle.reset()
			self.p2_paddle.reset()
			return True, datetime.now()
		return lastRoundChanged, None

	def wonControl(self):
		if self.p1_score >= WINNING_SCORE:
			print("KESIN BURASI1")
			self.won = True
		elif self.p2_score >= WINNING_SCORE:
			print("KESIN BURASI2")
			self.won = True
		if 	self.won == True:
			self.ball.reset()
			self.p1_paddle.reset()
			self.p2_paddle.reset()
		self.hitThePaddle = False

	async def powerUps(self, gameMode):
		if gameMode == "powerups":
			remaining_time = datetime.now() - self.lastPowerUpTime
			if remaining_time.total_seconds() >= 10.0 and self.powerUp.type == 0 and not self.powerUp.activated:
				await self.powerUp.createPowerUp()
			elif remaining_time.total_seconds() >= 20.0 and self.powerUp.type != 0:
				if self.powerUp.activated:
					await self.deactivatePowerUp()
					self.lastPowerUpTime = datetime.now()
				else:
					await self.powerUp.destroyPowerUp()
					self.lastPowerUpTime = datetime.now() - timedelta(seconds=10)

	async def activatePowerUp(self):
		print("POWERUP ACTIVATED")
		if self.powerUp.type == PowerUp.BIG_BALL:
			self.ball.radius += 10
		elif self.powerUp.type == PowerUp.SMALL_BALL:
			self.ball.radius -= 10
		elif self.powerUp.type == PowerUp.BIG_PADDLE:
			if self.powerUp.borderColor == PowerUp.RED:
				if self.lastTouchedPlayer == 1:
					self.lastEffectedPlayer = 2
					self.p2_paddle.height += 50
				elif self.lastTouchedPlayer == 2:
					self.lastEffectedPlayer = 1
					self.p1_paddle.height += 50
			elif self.powerUp.borderColor == PowerUp.GREEN:
				if self.lastTouchedPlayer == 1:
					self.lastEffectedPlayer = 1
					self.p1_paddle.height += 50
				elif self.lastTouchedPlayer == 2:
					self.lastEffectedPlayer = 2
					self.p2_paddle.height += 50
		elif self.powerUp.type == PowerUp.SMALL_PADDLE:
			if self.powerUp.borderColor == PowerUp.RED:
				if self.lastTouchedPlayer == 1:
					self.lastEffectedPlayer = 1
					self.p1_paddle.height -= 50
				elif self.lastTouchedPlayer == 2:
					self.lastEffectedPlayer = 2
					self.p2_paddle.height -= 50
			elif self.powerUp.borderColor == PowerUp.GREEN:
				if self.lastTouchedPlayer == 1:
					self.lastEffectedPlayer = 2
					self.p2_paddle.height -= 50
				elif self.lastTouchedPlayer == 2:
					self.lastEffectedPlayer = 1
					self.p1_paddle.height -= 50
		elif self.powerUp.type == PowerUp.FAST_BALL:
			self.ball.MAX_VEL += 5
			self.ball.x_vel = (self.ball.x_vel / 3.0) * 4.0
			self.ball.y_vel = (self.ball.y_vel / 3.0) * 4.0
		elif self.powerUp.type == PowerUp.SLOW_BALL:
			self.ball.MAX_VEL -= 5
			self.ball.x_vel = (self.ball.x_vel / 3.0) * 2.0
			self.ball.y_vel = (self.ball.y_vel / 3.0) * 2.0
		self.lastPowerUpTime = datetime.now() - timedelta(seconds=10)
		self.powerUp.activated = True
		print("ball radius: ", self.ball.radius, " ball max vel: ", self.ball.MAX_VEL, " ball x vel: ", self.ball.x_vel, " ball y vel: ", self.ball.y_vel, " p1 paddle height: ", self.p1_paddle.height, " p2 paddle height: ", self.p2_paddle.height)
		await self.powerUp.usePowerUp(self, 1)
		await self.powerUp.fakeDestroyPowerUp()


	async def deactivatePowerUp(self):
		print("POWERUP DEACTIVATED")
		if self.powerUp.type == PowerUp.BIG_BALL:
			self.ball.radius -= 10
		elif self.powerUp.type == PowerUp.SMALL_BALL:
			self.ball.radius += 10
		elif self.powerUp.type == PowerUp.BIG_PADDLE:
			if self.lastEffectedPlayer == 1:
				self.p1_paddle.height -= 50
			elif self.lastEffectedPlayer == 2:
				self.p2_paddle.height -= 50
		elif self.powerUp.type == PowerUp.SMALL_PADDLE:
			if self.lastEffectedPlayer == 1:
				self.p1_paddle.height += 50
			elif self.lastEffectedPlayer == 2:
				self.p2_paddle.height += 50
		elif self.powerUp.type == PowerUp.FAST_BALL:
			self.ball.MAX_VEL -= 5.0
			self.ball.x_vel = (self.ball.x_vel / 4.0) * 3.0
			self.ball.y_vel = (self.ball.y_vel / 4.0) * 3.0
		elif self.powerUp.type == PowerUp.SLOW_BALL:
			self.ball.MAX_VEL += 5.0
			self.ball.x_vel = (self.ball.x_vel / 2.0) * 3.0
			self.ball.y_vel = (self.ball.y_vel / 2.0) * 3.0
		self.lastEffectedPlayer = 0
		print("ball radius: ", self.ball.radius, " ball max vel: ", self.ball.MAX_VEL, " ball x vel: ", self.ball.x_vel, " ball y vel: ", self.ball.y_vel, " p1 paddle height: ", self.p1_paddle.height, " p2 paddle height: ", self.p2_paddle.height)
		await self.powerUp.usePowerUp(self, 0)
		await self.powerUp.destroyPowerUp()
