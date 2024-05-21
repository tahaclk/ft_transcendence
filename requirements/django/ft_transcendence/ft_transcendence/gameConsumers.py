import asyncio
import os
import signal
import uuid
from asgiref.sync import async_to_sync, sync_to_async
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from channels.generic.websocket import AsyncWebsocketConsumer
import multiprocessing
import json
import threading
from datetime import datetime, timedelta
import time
from django.db import connections
from ft_transcendence.game import PongGame, WINNING_SCORE
from userManageApp.models import Game, UserManage, Token, MatchStats

games = {}
room_counters = {}

class GameConsumer(AsyncWebsocketConsumer):
	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.disconnected = False

	async def game_backend(self, event):
		message = event['message']
		if not self.disconnected:
			await self.send(text_data=json.dumps({
				'message': message
			}))
		else:
			print("Message not sent because user disconnected")

	async def connect(self):
		token = self.scope["url_route"]["kwargs"]["token"]
		room_id = self.scope["url_route"]["kwargs"]["room_name"]
		if room_id in games:
			print("PLAYER CONNECTING GAME:" + str(games[room_id]))
		else:
			print("PLAYER CONNECTING GAME: None")
		try:
			_token = await database_sync_to_async(Token.objects.get)(token=token)
			user = await database_sync_to_async(UserManage.objects.get)(uid=_token.uid)
			game = await database_sync_to_async(Game.objects.get)(uuid=room_id)
			player1 = await database_sync_to_async(getattr)(game, 'player1')
		except Exception as e:
			print(e)
			print("Connection hatası!")
			await self.close()
			return

		await self.channel_layer.group_add(room_id, self.channel_name)
		room_counters[room_id] = room_counters.get(room_id, 0) + 1
		print("RoomCounter: " + str(room_counters[room_id]))
		if room_counters.get(room_id, 0) == 1:
			if user == player1:
				print("Player1 ATANMIŞTIR")
				games[room_id] = {"game_uuid":room_id, "player1": self.channel_name}
			else:
				print("Player2 ATANMIŞTIR")
				games[room_id] = {"game_uuid":room_id, "player2": self.channel_name}
		elif room_counters.get(room_id, 0) == 2:
			try:
				if "wait" in games[room_id]:
					del games[room_id]["wait"]
					if user == player1:
						games[room_id].update({"player1": self.channel_name})
					else:
						games[room_id].update({"player2": self.channel_name})
					await self.accept()
					return
			except:
				pass
			print("Baglanıldı")
			while room_id not in games or games[room_id] is None:
				await asyncio.sleep(0.05)
			if user == player1:
				games[room_id].update({"game": PongGame(game.startGameTimestamp, room_id), "player1": self.channel_name})
			else:
				games[room_id].update({"game": PongGame(game.startGameTimestamp, room_id), "player2": self.channel_name})
			games[room_id].update({"task": asyncio.create_task(GameConsumer.start_game(room_id))})
			print("GameOBJECT:" + str(games[room_id]))
		await self.accept()
		self.disconnected = False
		print(games[room_id])

	async def disconnect(self, close_code):
		room_id = self.scope["url_route"]["kwargs"]["room_name"]
		if room_id in games:
			print("USER DISCONNECTING GAME:" + str(games[room_id]))
		else:
			print("USER DISCONNECTING GAME: None")
		room_counters[room_id] -= 1
		if close_code != 3001 and close_code != 1000 and room_counters[room_id] != 0:
			games[room_id].update({"wait": "player1" if self.channel_name == games[room_id]["player1"] else "player2"})
			await asyncio.sleep(0.1)
		if room_id in room_counters and room_counters[room_id] == 0:
			if "wait" in games[room_id]:
				game = await database_sync_to_async(Game.objects.get)(uuid=room_id)
				winner = None
				if self.channel_name == games[room_id]["player1"]:
					games[room_id]["game"].p1_score, games[room_id]["game"].p2_score = 0, games[room_id]["game"].p2_score if games[room_id]["game"].p2_score > 0 else WINNING_SCORE
					winner = await database_sync_to_async(getattr)(game, 'player2')
				else:
					games[room_id]["game"].p1_score, games[room_id]["game"].p2_score = games[room_id]["game"].p1_score if games[room_id]["game"].p1_score > 0 else WINNING_SCORE, 0
					winner = await database_sync_to_async(getattr)(game, 'player1')
				await self.channel_layer.group_send(room_id, {"type": "game.backend", "message":{"end": {"s1": games[room_id]["game"].p1_score, "s2": games[room_id]["game"].p2_score, "winner": winner.displayname}}})
				filtered = await database_sync_to_async(Game.objects.filter)(uuid=room_id)
				await database_sync_to_async(filtered.update)(status=Game.FINISHED, score1=games[room_id]["game"].p1_score, score2=games[room_id]["game"].p2_score)
			#if close_code != 3001:
			#	filtered = await database_sync_to_async(Game.objects.filter)(uuid=room_id)
			#	await database_sync_to_async(filtered.update)(status=Game.FINISHED, score1=games[room_id]["game"].p1_score, score2=games[room_id]["game"].p2_score)
			
			if games[room_id]:
				del games[room_id]
			if room_counters[room_id]:
				del room_counters[room_id]
		self.disconnected = True
		await self.channel_layer.group_discard(room_id, self.channel_name)

	async def receive(self, text_data):
		room_id = self.scope["url_route"]["kwargs"]["room_name"]
		try:
			text_data_json = json.loads(text_data)
			print(text_data_json)
		except ValueError:
			return
		if "player1" in games[room_id] and self.channel_name == games[room_id]["player1"]:
			print("ben player1 im")
			if isinstance(text_data_json["message"], dict):
				text_data_json["message"].update({"from": "player1"})
		if "player2" in games[room_id] and self.channel_name == games[room_id]["player2"]:
			print("ben player2 yim")
			if isinstance(text_data_json["message"], dict):
				text_data_json["message"].update({"from": "player2"})
		match text_data_json["mode"]:
			case "getTimeStamp":
				await self.send(text_data=json.dumps({'message':{'getTimeStamp': str(datetime.now())}}))
			case "getLastRoundStartTime":
				await self.send(text_data=json.dumps({'message':{'lrs': games[room_id]["lrs"]}}))
			case "mv":
				if room_counters.get(room_id, 0) > 1 and text_data_json["message"]:
					if self.channel_name == games[room_id]["player1"]:
						games[room_id]["game"].keys["player1Up"] = int(text_data_json["message"]["u"])
						games[room_id]["game"].keys["player1Down"] = int(text_data_json["message"]["d"])
					elif self.channel_name == games[room_id]["player2"]:
						games[room_id]["game"].keys["player2Up"] = int(text_data_json["message"]["u"])
						games[room_id]["game"].keys["player2Down"] = int(text_data_json["message"]["d"])
			case "end":
				games[room_id]["game"].finishGame = True
				await asyncio.sleep(0.1)
				if self.channel_name == games[room_id]["player2"].channel_name:
					if games[room_id]["game"].p1_score > 0:
						games[room_id]["game"].p2_score = 0
						await self.channel_layer.group_send(room_id, {"type": "game.backend", "message":{"end": {"s1": games[room_id]["game"].p1_score, "s2": 0}}})
					else:
						games[room_id]["game"].p1_score, games[room_id]["game"].p2_score = WINNING_SCORE, 0
						await self.channel_layer.group_send(room_id, {"type": "game.backend", "message":{"end": {"s1": WINNING_SCORE, "s2": 0}}})
				else:
					if games[room_id]["game"].p2_score > 0:
						games[room_id]["game"].p1_score = 0
						await self.channel_layer.group_send(room_id, {"type": "game.backend", "message":{"end": {"s1": 0, "s2": games[room_id]["game"].p2_score}}})
					else:
						games[room_id]["game"].p1_score, games[room_id]["game"].p2_score = 0, WINNING_SCORE
						await self.channel_layer.group_send(room_id, {"type": "game.backend", "message":{"end": {"s1": 0, "s2": WINNING_SCORE}}})
				await database_sync_to_async(Game.objects.filter(uuid=room_id).update(status=Game.FINISHED, score1=games[room_id]["game"].p1_score, score2=games[room_id]["game"].p2_score))
				await self.channel_layer.group_send(room_id, {"type": "close.websocket", "exitCode": 3001})
			case "surrender":
				if self.channel_name == games[room_id]["player1"]:
					games[room_id]["game"].p1_score, games[room_id]["game"].p2_score = 0, WINNING_SCORE
				else:
					games[room_id]["game"].p1_score, games[room_id]["game"].p2_score = WINNING_SCORE, 0
				games[room_id]["game"].surrend = True

	async def close_websocket(self, event):
		close_code = event['exitCode']
		await self.close(code=close_code)


	async def start_game(room_name):
		try:
			gameDB = await database_sync_to_async(Game.objects.get)(uuid=room_name)
			print("STATS CREATİNG")
			p1 = await database_sync_to_async(getattr)(gameDB, "player1")
			p2 = await database_sync_to_async(getattr)(gameDB, "player2")
			p1Stats = await database_sync_to_async(MatchStats)(game=gameDB, user=p1, enemy=p2, gameMode=gameDB.mode)
			p2Stats = await database_sync_to_async(MatchStats)(game=gameDB, user=p2, enemy=p1, gameMode=gameDB.mode)
			print("STATS CREATED")
			channel_layer = get_channel_layer()
		except Exception as e:
			print(e)
			return
		games[room_name].update({"lrs": None})
		lastRoundChanged = True
		afterWait = False
		game = games[room_name]["game"]
		while gameDB.startGameTimestamp > datetime.now():
			await asyncio.sleep(0.005)
		roundStartTime = datetime.now()
		emptyTime = timedelta()
		while not game.won and not game.finishGame:
			if "wait" in games[room_name]:
				now = datetime.now() + timedelta(seconds=10)
				tmpTime = datetime.now()
				disconnectedUser = None
				if games[room_name]["wait"] == "player1":
					disconnectedUser = await database_sync_to_async(getattr)(gameDB, "player1")
				else:
					disconnectedUser = await database_sync_to_async(getattr)(gameDB, "player2")
				await channel_layer.group_send(room_name,
				{
					"type": "game.backend",
					"message":
					{
						"wait":
						{
							"disconnected": disconnectedUser.displayname,
							"finishTime": str(now)
						}
					}
				})
				while "wait" in games[room_name] and not game.finishGame and datetime.now() < now:
					await asyncio.sleep(0.05)
				tmpTimeDelta = datetime.now() - tmpTime
				emptyTime += tmpTimeDelta
				if "wait" not in games[room_name]:
					afterWait = True
					continue
				if game.finishGame:
					continue
				if datetime.now() >= now:
					winner = None
					if games[room_name]["wait"] == "player1":
						games[room_name]["game"].p1_score, games[room_name]["game"].p2_score = 0, games[room_name]["game"].p2_score if games[room_name]["game"].p2_score > 0 else WINNING_SCORE
						winner = await database_sync_to_async(getattr)(gameDB, 'player2')
					else:
						games[room_name]["game"].p1_score, games[room_name]["game"].p2_score = games[room_name]["game"].p1_score if games[room_name]["game"].p1_score > 0 else WINNING_SCORE, 0
						winner = await database_sync_to_async(getattr)(gameDB, 'player1')
					await channel_layer.group_send(room_name, {"type": "game.backend", "message":{"end": {"s1": games[room_name]["game"].p1_score, "s2": games[room_name]["game"].p2_score, "winner": winner.displayname}}})
					filtered = await database_sync_to_async(Game.objects.filter)(uuid=room_name)
					await database_sync_to_async(filtered.update)(status=Game.FINISHED, score1=games[room_name]["game"].p1_score, score2=games[room_name]["game"].p2_score)
					game.won = True
				continue
			await game.clock.tick()
			await game.powerUps(gameDB.mode)
			game.handle_paddle_movement()
			game.ball.move()
			await game.handle_collision(gameDB.mode)
			lastRoundChanged, roundFinishTime = await game.scoreCheck(lastRoundChanged)
			if roundFinishTime != None:
				p1Stats.allRoundTimes.append(int((roundFinishTime - roundStartTime - emptyTime).total_seconds() * 1000))
				p2Stats.allRoundTimes.append(int((roundFinishTime - roundStartTime - emptyTime).total_seconds() * 1000))
				roundStartTime = roundFinishTime
				emptyTime = timedelta()
			game.wonControl()
			if game.surrend:
				game.won = True
			if not game.won:
				message_dict = {
					"x": game.ball.x,
					"y": game.ball.y,
					"vX": game.ball.x_vel,
					"vY": game.ball.y_vel,
					"p1": game.p1_paddle.y,
					"p2": game.p2_paddle.y,
					"s1": game.p1_score,
					"s2": game.p2_score,
					"fc": game.frameCounter,
				}
				if lastRoundChanged == True or afterWait == True:
					if afterWait == False:
						games[room_name]["lrs"] = str(datetime.now())
					else:
						afterWait = False
						if games[room_name]["lrs"] == None:
							games[room_name]["lrs"] = str(datetime.now())
					message_dict.update({"lrs" : games[room_name]["lrs"]})
					lastRoundChanged = False
				if gameDB.mode == "boosted":
					message_dict.update({"maxV": game.ball.MAX_VEL})
				await channel_layer.group_send(room_name,
				{
					"type": "game.backend",
					"message": message_dict
				})
			else:
				if game.p1_score == WINNING_SCORE:
					winner = await database_sync_to_async(getattr)(gameDB, 'player1')
				else:
					winner = await database_sync_to_async(getattr)(gameDB, 'player2')
				p1Stats.scoredGoals = game.p1_score
				p1Stats.concededGoals = game.p2_score
				p2Stats.scoredGoals = game.p2_score
				p2Stats.concededGoals = game.p1_score
				p1Stats.ballTouched = game.p1_paddle.ballTouches
				p2Stats.ballTouched = game.p2_paddle.ballTouches
				p1Stats.catchedPowerUps = game.catchedPowerUps
				p2Stats.catchedPowerUps = game.catchedPowerUps
				gameDB.status = Game.FINISHED
				gameDB.score1 = game.p1_score
				gameDB.score2 = game.p2_score
				await database_sync_to_async(p1Stats.save)()
				await database_sync_to_async(p2Stats.save)()
				await database_sync_to_async(gameDB.save)()
				#TURNUVAA
				print("TURNUVAYI GETİRİYORUM")
				tournament = await database_sync_to_async(gameDB.getTournamentObject)()
				print("TURNUVAYI ALDIM")
				print(tournament)
				print("TURNUVAYI YAZDIRDIM")
				tmp = -1
				if tournament is not None:
					await database_sync_to_async(tournament.doNextStep)(gameDB)
					if await database_sync_to_async(getattr)(tournament, "sendNextMatchSwitch") == True:
						tmp = tournament.id
				await channel_layer.group_send(room_name,
				{
					"type": "game.backend",
					"message":
					{
						"end":
						{
							"s1": game.p1_score,
							"s2": game.p2_score,
							"winner": winner.displayname,
							"semiMatchsFinished": tmp
						}
					}
				})
				await channel_layer.group_send(room_name, {"type": "close.websocket", "exitCode": 1000})
		game.frameCounter += 1
		print("Process ended")
