from channels.generic.websocket import WebsocketConsumer
from userManageApp.models import Token, Tournament, UserManage, TournamentInvite
from asgiref.sync import async_to_sync
from django.db.models import Q
import json

class TournamentConsumer(WebsocketConsumer):
	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.disconnected = False
		
	def connect(self):
		async_to_sync(self.channel_layer.group_add)("tournament", self.channel_name)
		self.accept()
		self.disconnected = False

	def disconnect(self, close_code):
		async_to_sync(self.channel_layer.group_discard)("tournament", self.channel_name)
		self.disconnected = True
		self.close()

	def group_backend(self, event):
		message = event['message']
		if not self.disconnected:
			self.send(text_data=json.dumps({
				'message': message
			}))
		else:
			print("Message not sent because user disconnected")

	def receive(self, text_data):
		text_data_json = json.loads(text_data)
		match text_data_json["mode"]:
			case "getActiveTournaments":
				self.get_active_tournaments(text_data_json)
			case "create-tournament":
				self.createTournament(text_data_json)
			case "close-tournament":
				self.closeTournament(text_data_json)
			case "join-tournament":
				self.joinTournament(text_data_json)
			case "leave-tournament":
				self.leaveTournament(text_data_json)
			case _:
				self.send_message({"mode": "error", "message": "Invalid mode"})

	def send_message(self, message):
		self.send(text_data=json.dumps(message))

	def get_active_tournaments(self, text_data=None):
		actives = Tournament.objects.filter(status=Tournament.SEARCHINGPLAYERS)
		objs = []
		for active in actives:
			objs.append({
				"id": active.id,
				"name": active.name,
				"gamemode": active.mode,
				"players": active.getPlayerCount(),
				"creatorThumbnail": active.creator.thumbnail.url,
				"creatorDisplayName": active.creator.displayname,
				"creatorUsername": active.creator.username,
				"creatorUid": active.creator.uid,
				"status": active.status,
				"timestamp": str(active.timestamp),
				"joinedUids": [a.uid for a in [active.p1, active.p2, active.p3, active.p4] if a is not None]
			})
		self.send_message({"mode": "getActiveTournaments", "message": objs})
		try:
			token = Token.objects.get(token=text_data["token"])
			user = UserManage.objects.get(uid=token.uid)
			joined = Tournament.objects.filter(status=Tournament.INPROGRESS).filter(Q(p1=user) | Q(p2=user) | Q(p3=user) | Q(p4=user))
			if joined.exists():
				joined = joined[0]
				self.send_message({"mode": "joinedTournament", "message": {
					"id": joined.id,
					"name": joined.name,
					"gamemode": joined.mode,
					"timestamp": str(joined.timestamp.strftime("%m/%d/%Y, %H:%M:%S")),
					"creatorThumbnail": joined.creator.thumbnail.url,
					"creatorDisplayName": joined.creator.displayname,
					"creatorUsername": joined.creator.username,
					"creatorUid": joined.creator.uid,
					"p1_username": joined.p1.username if joined.p1 else None,
					"p2_username": joined.p2.username if joined.p2 else None,
					"p3_username": joined.p3.username if joined.p3 else None,
					"p4_username": joined.p4.username if joined.p4 else None,
					"p1_displayname": joined.p1.displayname if joined.p1 else None,
					"p2_displayname": joined.p2.displayname if joined.p2 else None,
					"p3_displayname": joined.p3.displayname if joined.p3 else None,
					"p4_displayname": joined.p4.displayname if joined.p4 else None,
					"p1_thumbnail": joined.p1.thumbnail.url if joined.p1 else None,
					"p2_thumbnail": joined.p2.thumbnail.url if joined.p2 else None,
					"p3_thumbnail": joined.p3.thumbnail.url if joined.p3 else None,
					"p4_thumbnail": joined.p4.thumbnail.url if joined.p4 else None,
					"semiMatch1_p1": joined.semiMatch1.player1.username if joined.semiMatch1 else None,
					"semiMatch1_p2": joined.semiMatch1.player2.username if joined.semiMatch1 else None,
					"semiMatch2_p1": joined.semiMatch2.player1.username if joined.semiMatch2 else None,
					"semiMatch2_p2": joined.semiMatch2.player2.username if joined.semiMatch2 else None,
					"thirdPlaceMatch_p1": joined.thirdPlaceMatch.player1.username if joined.thirdPlaceMatch else None,
					"thirdPlaceMatch_p2": joined.thirdPlaceMatch.player2.username if joined.thirdPlaceMatch else None,
					"finalMatch_p1": joined.finalMatch.player1.username if joined.finalMatch else None,
					"finalMatch_p2": joined.finalMatch.player2.username if joined.finalMatch else None,
				}})
		except Exception as e:
			print(e)
			return

	def tournament_backend(self, event):
		print("LETSGOOOOOO")
		print(self)
		message = event['message']
		if not self.disconnected:
			print("GONDDERRRDİMMM")
			self.send(text_data=json.dumps({
				'mode': "requestGetActiveTournaments",
				'message': "true"
			}))
		else:
			print("Message not sent because user disconnected")

	def createTournament(self, text_data):
		message = text_data["message"]
		if message["name"] == "":
			return -1
		if message["mode"] not in ["classic", "boosted", "powerups"]:
			return -1
		token = Token.objects.get(token=text_data["token"])
		user = UserManage.objects.get(uid=token.uid)
		if Tournament.objects.filter(Q(status=Tournament.INPROGRESS) | Q(status=Tournament.SEARCHINGPLAYERS)).filter(Q(p1=user) | Q(p2=user) | Q(p3=user) | Q(p4=user)).exists():
			self.send_message({"mode": "error", "message": "You are already in a tournament"})
			return
		match message["mode"]:
			case "classic":
				t = Tournament.objects.create(name=message["name"], mode="classic", creator=user, p1=user)
				t.save()
				self.tournamentSendUpdates()
			case "boosted":
				t = Tournament.objects.create(name=message["name"], mode="boosted", creator=user, p1=user)
				t.save()
				self.tournamentSendUpdates()
			case "powerups":
				t = Tournament.objects.create(name=message["name"], mode="powerups", creator=user, p1=user)
				t.save()
				self.tournamentSendUpdates()
		print("Message sent to backend")

	def closeTournament(self, text_data):
		message = text_data["message"]
		token = Token.objects.get(token=text_data["token"])
		user = UserManage.objects.get(uid=token.uid)
		try:
			tid = int(message["tournamentID"])
			print("SATIR 153")
			t = Tournament.objects.get(id=tid)
			if t and t.creator == user:
				ti = TournamentInvite.objects.filter(tournament=t)
				if ti.exists():
					ti.delete()
				t.delete()
				self.tournamentSendUpdates()
		except:
			print("uid de bir ibnelik var ya yok yada sayı değil")

	def joinTournament(self, text_data):
		message = text_data["message"]
		token = Token.objects.get(token=text_data["token"])
		user = UserManage.objects.get(uid=token.uid)
		for tourn in Tournament.objects.filter(Q(status=Tournament.INPROGRESS) | Q(status=Tournament.SEARCHINGPLAYERS)):
			if user in [tourn.p1, tourn.p2, tourn.p3, tourn.p4]:
				self.send_message({"mode": "error", "message": "You are already in a tournament"})
				return
		try:
			tid = int(message["tournamentID"])
			t = Tournament.objects.get(id=tid)
			if t:
				if t.p1 is None:
					t.p1 = user
				elif t.p2 is None:
					t.p2 = user
				elif t.p3 is None:
					t.p3 = user
				elif t.p4 is None:
					t.p4 = user
				else:
					self.send_message({"mode": "error", "message": "Tournament is full"})
					return
				t.save()
				self.send_message({"mode": "joinTournament", "message": "You have joined the tournament"})
				self.tournamentSendUpdates()
				if t.getPlayerCount() == 4:
					t.semiMatchMaker()	# BURADA MAÇLAR OLUŞTURULMUŞSA PLAYERLARA MAÇLAR GÖNDERİLECEK
					async_to_sync(self.channel_layer.group_send)("tournament",
					{
						"type": "group.backend",
						"message":
						{
							"goCheckMatchMaking": str(t.id)
						}
					})
					ti = TournamentInvite.objects.filter(tournament=t)
					if ti.exists():
						ti.delete()
					self.tournamentSendUpdates()
		except:
			print("uid de bir ibnelik var ya yok yada sayı değil")

	def tournamentSendUpdates(self):
		async_to_sync(self.channel_layer.group_send)("tournament",
		{
			"type": "tournament.backend",
			"message": ""
		})

	def leaveTournament(self, text_data):
		message = text_data["message"]
		token = Token.objects.get(token=text_data["token"])
		user = UserManage.objects.get(uid=token.uid)
		for tourn in Tournament.objects.filter(Q(status=Tournament.INPROGRESS) | Q(status=Tournament.SEARCHINGPLAYERS)):
			if user in [tourn.p1, tourn.p2, tourn.p3, tourn.p4] and tourn.getPlayerCount() < 4:
				try:
					if user == tourn.p1:
						tourn.p1 = None
					elif user == tourn.p2:
						tourn.p2 = None
					elif user == tourn.p3:
						tourn.p3 = None
					elif user == tourn.p4:
						tourn.p4 = None
					else:
						self.send_message({"mode": "error", "message": "You are not in this tournament"})
						return
					tourn.save()
					self.send_message({"mode": "leaveTournament", "message": "You have left the tournament"})
					self.tournamentSendUpdates()
				except:
					self.send_message("error", "You are not in a tournament")
				return
		self.send_message("error", "You are not in a tournament")