from channels.generic.websocket import WebsocketConsumer
from userManageApp.models import Token, UserManage, Message, Friendship, FriendshipRequest, BlockList, Game, Tournament, TournamentInvite, GameInvite
from django.db.models import Q
from django.db import models
import json
from datetime import datetime, timedelta
from django.utils import timezone
from threading import Timer
from ft_transcendence.tournamentConsumers import TournamentConsumer

connected_users = []

Game.objects.filter(status=Game.SEARCHING).delete()

class ChatConsumer(WebsocketConsumer):
	def connect(self):
		self.accept()

	def disconnect(self, status_code):
		disconnected_user = None
		for e in connected_users:
			if self == e["socket"]:
				disconnected_user = UserManage.objects.get(uid=e["user_uid"])
				sent_messages = Message.objects.filter(_from=disconnected_user)
				received_messages = Message.objects.filter(_to=disconnected_user)
				all_messages = sent_messages | received_messages
				friendShips = UserManage.objects.filter(Q(sent_messages__in=all_messages) | Q(received_messages__in=all_messages)).distinct()
				friendShips = friendShips.exclude(pk=disconnected_user.pk)
				for conUser in connected_users:
					for friend in friendShips:
						if conUser["user_uid"] == str(friend.uid):
							conUser["socket"].send(text_data=json.dumps({
								"user_uid": str(disconnected_user.uid),
								"onlineStatus": "offline"
							}))
				user_disconnected = Game.objects.filter(player1=disconnected_user, status=Game.SEARCHING)
				if user_disconnected:
					user_disconnected.delete()
				connected_users.remove(e)


	def receive(self, text_data):
		textData = json.loads(text_data)
		if not tokenControl(self, textData):
			return
		print(text_data)
		match textData["mode"]:
			case "get-friends":
				self.send(text_data=json.dumps({
					'friends': fill_friends(textData["token"])
				}))
			case "get-message-history":
				print(text_data)
				self.send(text_data=json.dumps({
					'message_history': message_history(textData["token"], textData["message"]["to"])
				}))
			case "send-message":
				print(text_data)
				msg, warning = sendMessage(textData)
				if warning != "":
					self.send(text_data=json.dumps({
						'sended_message': msg,
						'warning': warning
					}))
					return
				for e in connected_users:
					if e["user_uid"] == str(msg["to"]):
						e["socket"].send(text_data=json.dumps({
							'sended_message': msg,
							'warning': warning
						}))
					elif e["user_uid"] == str(msg["from"]):
						e["socket"].send(text_data=json.dumps({
							'sended_message': msg,
							'warning': warning
						}))
			case "user-register":
				print("USER REGISTER")
				print(text_data)
				_token = Token.objects.get(token=textData["token"])
				user = UserManage.objects.get(uid=_token.uid)
				userOnline(user)
				connected_users.append({
					"socket": self,
					"user_uid": str(user.uid)
				})
				print(connected_users)
			case "getFriendRequestList":
				print(text_data)
				_token = Token.objects.get(token=textData["token"])
				user = UserManage.objects.get(uid=_token.uid)
				fRqs = FriendshipRequest.objects.filter(receiver=user)
				users = []
				for frq in fRqs:
					sender_uid = frq.sender.uid
					sender_displayname = frq.sender.displayname
					sender_username = frq.sender.username
					sender_thumbnail = frq.sender.thumbnail.url
					sender_timestamp = frq.timestamp
					sender = {"from_uid": str(sender_uid), "displayname": sender_displayname, "from_username": sender_username, "thumbnail": sender_thumbnail, "timestamp": str(sender_timestamp)}
					users.append(sender)
				tournaments = []
				tournamentInvites = TournamentInvite.objects.filter(invited=user)
				for ti in tournamentInvites:
					tmp = {
						"tournamentId": ti.tournament.id,
						"tournamentName": ti.tournament.name,
						"inviter_uid": ti.inviter.uid,
						"inviter_displayname": ti.inviter.displayname,
						"inviter_thumbnail": ti.inviter.thumbnail.url,
						"invited_uid": user.uid,
						"invited_displayname": user.displayname
					}
					tournaments.append(tmp)
				gameInvites = []
				gameInvite = GameInvite.objects.filter(invited=user)
				for gi in gameInvite:
					tmp = {
						"from_uid": gi.inviter.uid,
						"from_username": gi.inviter.username,
						"from_displayname": gi.inviter.displayname,
						"from_thumbnail": gi.inviter.thumbnail.url
					}
					gameInvites.append(tmp)
				self.send(text_data=json.dumps({
					'friendRequestList': {
						"users": users,
						"tournaments": tournaments,
						"games": gameInvites
					}
				}))

			case "sendFriendRequest":
				print(text_data)
				_token = Token.objects.get(token=textData["token"])
				user = UserManage.objects.get(uid=_token.uid)
				to_user = UserManage.objects.get(uid=int(textData["message"]["uid"]))
				if BlockList.isBlocked(user, to_user):
					self.send(text_data=json.dumps({
						'friendShipView': {
							"type": "youAreBlocked",
							"to_uid": to_user.uid,
							"to_username": to_user.username
						}}))
					return
				fq = FriendshipRequest.objects.create(sender=user, receiver=to_user)
				fq.save()
				for e in connected_users:
					if e["user_uid"] == str(to_user.uid):
						e["socket"].send(text_data=json.dumps({
						'friendShipRequest': {
							"from_uid": user.uid,
							"displayname": user.displayname,
							"from_username": user.username,
							"thumbnail": user.thumbnail.url,
							"timestamp": str(datetime.now())
						}}))
						e["socket"].send(text_data=json.dumps({
						'friendShipView': {
							"type": "friendrequest",
							"from_uid": user.uid,
							"from_username": user.username
						}}))
			case "friendShipResponse":
				print(text_data)
				_token = Token.objects.get(token=textData["token"])
				user = UserManage.objects.get(uid=_token.uid)
				to_user = UserManage.objects.get(uid=int(textData["message"]["to_uid"]))
				response = textData["message"]["response"]
				match response:
					case "accept":
						fq = FriendshipRequest.objects.filter(sender=to_user, receiver=user)
						if fq.exists():
							fq.delete()
							newFq = Friendship.objects.create(user1=to_user, user2=user)
							newFq.save()
					case "reject":
						fq = FriendshipRequest.objects.filter(sender=to_user, receiver=user)
						fq.delete()
					case _:
						return
				for e in connected_users:
					if e["user_uid"] == str(to_user.uid):
						e["socket"].send(text_data=json.dumps({
							'friendShipView': {
								"type": "friendresponse",
								"status": response,
								"from_uid": user.uid,
								"from_username": user.username
							}
						}))
			case "unFriendRequest":
				_token = Token.objects.get(token=textData["token"])
				user = UserManage.objects.get(uid=_token.uid)
				to_user = UserManage.objects.get(uid=int(textData["message"]["to_uid"]))
				friendship = Friendship.objects.filter(Q(user1=user, user2=to_user) | Q(user1=to_user, user2=user))
				if friendship.exists():
					friendship[0].delete()
				for e in connected_users:
					if e["user_uid"] == str(to_user.uid):
						e["socket"].send(text_data=json.dumps({
							'friendShipView': {
								"type": "unfriend",
								"from_uid": user.uid,
								"from_username": user.username
							}
						}))
			case "cancelRequest":
				_token = Token.objects.get(token=textData["token"])
				user = UserManage.objects.get(uid=_token.uid)
				to_user = UserManage.objects.get(uid=int(textData["message"]["to_uid"]))
				fq = FriendshipRequest.objects.filter(sender=user, receiver=to_user)
				fq.delete()
				for e in connected_users:
					if e["user_uid"] == str(to_user.uid):
						e["socket"].send(text_data=json.dumps({
							'friendShipView': {
								"type": "cancel",
								"from_uid": user.uid,
								"from_username": user.username
							}
						}))
			case "searchUsers":
				queryName = textData["message"]
				users = UserManage.objects.filter(Q(displayname__startswith=queryName) | Q(username__startswith=queryName) |
												Q(displayname__icontains=queryName) | Q(username__icontains=queryName)).distinct()[:20]
				searchUser = {
					"usersQueryResult": []
				}
				for user in users:
					searchUser["usersQueryResult"].append({"username": user.username, "displayname": user.displayname, "thumbnail": user.thumbnail.url})
				self.send(text_data=json.dumps(searchUser))
			case "readMessage":
				_token = Token.objects.get(token=textData["token"])
				user = UserManage.objects.get(uid=_token.uid)
				to_user = UserManage.objects.get(uid=int(textData["message"]["to_uid"]))
				Message.objects.filter(_from=to_user, _to=user, isReaded=False).update(isReaded=True)
			case "getMatch":
				_token = Token.objects.get(token=textData["token"])
				user = UserManage.objects.get(uid=_token.uid)
				try:
					mode = textData["message"]
					game = Game.objects.filter(player1=user, mode=mode, status=Game.SEARCHING).first()
					if game:
						game.delete()
					game = Game.objects.filter(mode=mode, status=Game.SEARCHING).first()
					if game:
						self.send(text_data=json.dumps({
							'getMatch': {
								"game_uuid": str(game.uuid),
								"game_status": str(game.status),
								"game_mode": str(game.mode),
								"game_startTimestamp": str(game.startGameTimestamp),
								"p1_uid": str(game.player1.uid),
								"p1_username": game.player1.username,
								"p1_displayname": game.player1.displayname,
								"p1_thumbnail": game.player1.thumbnail.url,
								"p2_uid": str(game.player2.uid if game.player2 else ""),
								"p2_username": game.player2.username if game.player2 else "",
								"p2_displayname": game.player2.displayname if game.player2 else "",
								"p2_thumbnail": game.player2.thumbnail.url if game.player2 else ""
							}
						}))
					else:
						self.send(text_data=json.dumps({
							'getMatch': {
								"game_uuid": "",
								"game_status": "",
								"game_mode": mode,
								"game_startTimestamp": "",
								"p1_uid": "",
								"p1_username": "",
								"p1_displayname": "",
								"p1_thumbnail": "",
								"p2_uid": "",
								"p2_username": "",
								"p2_displayname": "",
								"p2_thumbnail": ""
							}
						}))
				except Exception as e:
					print(e)
			case "joinQuickMatch":
				_token = Token.objects.get(token=textData["token"])
				user = UserManage.objects.get(uid=_token.uid)
				gameMode = textData["message"]
				modes = ["classic", "powerups", "boosted"]
				if gameMode not in modes:
					return
				game = Game.joinQuickMatch(user, mode=gameMode)
				if game.status == Game.INGAME:
					tmpUser = game.player2 if user == game.player1 else game.player1
					for e in connected_users:
						if e["user_uid"] == str(tmpUser.uid):
							e["socket"].send(text_data=json.dumps({
								'joinQuickMatch': {
									"game_uuid": str(game.uuid),
									"game_status": str(game.status),
									"game_mode": game.mode,
									"game_startTimestamp": str(game.startGameTimestamp),
									"p1_uid": str(game.player1.uid),
									"p1_username": game.player1.username,
									"p1_displayname": game.player1.displayname,
									"p1_thumbnail": game.player1.thumbnail.url,
									"p2_uid": str(game.player2.uid),
									"p2_username": game.player2.username,
									"p2_displayname": game.player2.displayname,
									"p2_thumbnail": game.player2.thumbnail.url
								}
							}))
				self.send(text_data=json.dumps({
						'joinQuickMatch': {
							"game_uuid": str(game.uuid),
							"game_status": str(game.status),
							"game_mode": game.mode,
							"game_startTimestamp": str(game.startGameTimestamp),
							"p1_uid": str(game.player1.uid),
							"p1_username": game.player1.username,
							"p1_displayname": game.player1.displayname,
							"p1_thumbnail": game.player1.thumbnail.url,
							"p2_uid": str(game.player2.uid if game.player2 else ""),
							"p2_username": game.player2.username if game.player2 else "",
							"p2_displayname": game.player2.displayname if game.player2 else "",
							"p2_thumbnail": game.player2.thumbnail.url if game.player2 else ""
						}
					}))
			case "closeMatch":
				_token = Token.objects.get(token=textData["token"])
				user = UserManage.objects.get(uid=_token.uid)
				game = Game.objects.filter(player1=user, status=1).first()
				if game:
					game.delete()
			case "isInMatch":
				_token = Token.objects.get(token=textData["token"])
				user = UserManage.objects.get(uid=_token.uid)
				game = Game.objects.filter(Q(player1=user, status=3) | Q(player2=user, status=3)).first()
				self.send(text_data=json.dumps({
					'isInMatch': {
						"game_uuid": str(game.uuid),
						"game_status": str(game.status),
						"game_mode": game.mode,
						"game_startTimestamp": str(game.startGameTimestamp),
						"p1_uid": str(game.player1.uid),
						"p1_username": game.player1.username,
						"p1_displayname": game.player1.displayname,
						"p1_thumbnail": game.player1.thumbnail.url,
						"p2_uid": str(game.player2.uid),
						"p2_username": game.player2.username,
						"p2_displayname": game.player2.displayname,
						"p2_thumbnail": game.player2.thumbnail.url
					} if game else {}
				}))
			case "areYouSearching":
				if textData["message"] == "False":
					print("KARDEŞM HEMEN SİLİYORUM MAÇI RAHATTA KALL")
					_token = Token.objects.get(token=textData["token"])
					user = UserManage.objects.get(uid=_token.uid)
					game = Game.objects.filter(Q(player1=user, status=Game.SEARCHING) | Q(player2=user, status=Game.SEARCHING)).first()
					if game:
						game.delete()
			case "getInvitableFriends":
				_token = Token.objects.get(token=textData["token"])
				user = UserManage.objects.get(uid=_token.uid)
				fsObjs = Friendship.objects.filter(Q(user1=user) | Q(user2=user))
				if not fsObjs.exists():
					self.send(text_data=json.dumps({
						'invitableFriends': []
					}))
					return
				fs = []
				for f in fsObjs:
					if f.user1 == user:
						fs.append(f.user2)
					else:
						fs.append(f.user1)
				invitableFriends = []
				for f in fs:
					invitable = False
					if not Game.objects.filter(Q(player1=f, status=Game.INGAME) | Q(player2=f, status=Game.INGAME)).exists():
						invitable= True
					invitableFriends.append({
						"uid": f.uid,
						"username": f.username,
						"displayname": f.displayname,
						"thumbnail": f.thumbnail.url,
						"invitable": invitable
					})
				self.send(text_data=json.dumps({
					'invitableFriends': invitableFriends
				}))
			case "inviteTournamentUser":
				_token = Token.objects.get(token=textData["token"])
				user = UserManage.objects.get(uid=_token.uid)
				print("inviteTournamentUser BURADA KARDŞM")
				try:
					to_user = UserManage.objects.get(uid=int(textData["message"]["uid"]))
					tournament = Tournament.objects.get(id=textData["message"]["tournamentId"])
					print("TOURNAMENT OBJECT BURADA KARDŞM")
				except e:
					return
				if Game.objects.filter(Q(player1=to_user, status=Game.INGAME) | Q(player2=to_user, status=Game.INGAME)).exists():
					return
				print("KULLANICI INGAME DE DEGIL")
				if tournament.getPlayerCount() != 4 and tournament.p1 != to_user and tournament.p2 != to_user and tournament.p3 != to_user and tournament.p4 != to_user:
					print("PLAYER TURNUVAda DEĞİL")
					if TournamentInvite.objects.filter(tournament=tournament, invited=to_user).exists():
						return
					print("HERHANGİ BİR DAVET ALMAMIŞ")
					t = TournamentInvite.objects.create(tournament=tournament, inviter=user, invited=to_user)
					t.save()
					#send notification
					print("SENDING NOTIFICATINS")
					for e in connected_users:
						if e["user_uid"] == str(to_user.uid):
							e["socket"].send(text_data=json.dumps({
								'youAreInvited': {
									"tournamentId": tournament.id,
									"tournamentName": tournament.name,
									"inviter_uid": user.uid,
									"inviter_displayname": user.displayname,
									"inviter_thumbnail": user.thumbnail.url,
									"invited_uid": to_user.uid,
									"invited_displayname": to_user.displayname
								}
							}))
							print("SENDED NOTIFICATINS")
				else:
					return
			case "tournamentAccept":
				try:
					_token = Token.objects.get(token=textData["token"])
					user = UserManage.objects.get(uid=_token.uid)
					tournament = Tournament.objects.get(id=textData["message"]["tournamentId"])
					ti = TournamentInvite.objects.get(tournament=tournament, invited=user)
					if Tournament.objects.filter(Q(p1=user) | Q(p2=user) | Q(p3=user) | Q(p4=user)).exclude(status=Tournament.FINISHED).exists():
						raise Exception("User is already in a tournament")
					if tournament.getPlayerCount() != 4 and tournament.p1 != user and tournament.p2 != user and tournament.p3 != user and tournament.p4 != user:
						if Game.objects.filter(Q(player1=user, status=Game.INGAME) | Q(player2=user, status=Game.INGAME)).exists():
							raise Exception("User is already in a game")
						if tournament.p1 == None:
							tournament.p1 = user
						elif tournament.p2 == None:
							tournament.p2 = user
						elif tournament.p3 == None:
							tournament.p3 = user
						elif tournament.p4 == None:
							tournament.p4 = user
						tournament.save()
						ti.delete()
						if tournament.isReadyForMatchMaking():
							tournament.semiMatchMaker()
							ti = TournamentInvite.objects.filter(tournament=tournament)
							if ti.exists():
								ti.delete()
						for e in connected_users:
							e["socket"].send(text_data=json.dumps({
								'reloadTournamentPage': "true"
							}))
				except Exception as e:
					print(str(e))
					return
			case "tournamentReject":
				_token = Token.objects.get(token=textData["token"])
				user = UserManage.objects.get(uid=_token.uid)
				tournament = Tournament.objects.get(id=textData["message"]["tournamentId"])
				ti = TournamentInvite.objects.filter(tournament=tournament, invited=user)
				ti.delete()
			case "getTournamentMatchs":
				try:
					_token = Token.objects.get(token=textData["token"])
					user = UserManage.objects.get(uid=_token.uid)
					tournament = Tournament.objects.get(id=textData["message"]["tournamentId"])
					tMatch = None
					if tournament.finalMatch and tournament.thirdPlaceMatch:
						for e in connected_users:
							if self == e["socket"]:
								if e["user_uid"] == str(tournament.finalMatchPlayer1.uid) or e["user_uid"] == str(tournament.finalMatchPlayer2.uid):
									tMatch = tournament.finalMatch
								elif e["user_uid"] == str(tournament.thirdPlaceMatchPlayer1.uid) or e["user_uid"] == str(tournament.thirdPlaceMatchPlayer2.uid):
									tMatch = tournament.thirdPlaceMatch
					elif tournament.semiMatch1 and tournament.semiMatch2:
						for e in connected_users:
							if self == e["socket"]:
								if e["user_uid"] == str(tournament.semiMatch1.player1.uid) or e["user_uid"] == str(tournament.semiMatch1.player2.uid):
									tMatch = tournament.semiMatch1
								elif e["user_uid"] == str(tournament.semiMatch2.player1.uid) or e["user_uid"] == str(tournament.semiMatch2.player2.uid):
									tMatch = tournament.semiMatch2
					if tMatch is not None:
						self.send(text_data=json.dumps({
							"nextMatch": {
								"p1_uid": tMatch.player1.uid,
								"p1_username": tMatch.player1.username,
								"p1_thumbnail": tMatch.player1.thumbnail.url,
								"p2_uid": tMatch.player2.uid,
								"p2_username": tMatch.player2.username,
								"p2_thumbnail": tMatch.player2.thumbnail.url
							}
						}))
				except Exception as e:
					print(f"An error occurred: {e}")
			case "getTournamentMatchsEveryone":
				try:
					_token = Token.objects.get(token=textData["token"])
					user = UserManage.objects.get(uid=_token.uid)
					tournament = Tournament.objects.get(id=textData["message"]["tournamentId"])
					for _self in connected_users:
						tMatch = None
						if tournament.finalMatch and tournament.thirdPlaceMatch:
							if _self["user_uid"] == str(tournament.finalMatchPlayer1.uid) or _self["user_uid"] == str(tournament.finalMatchPlayer2.uid):
								tMatch = tournament.finalMatch
							elif _self["user_uid"] == str(tournament.thirdPlaceMatchPlayer1.uid) or _self["user_uid"] == str(tournament.thirdPlaceMatchPlayer2.uid):
								tMatch = tournament.thirdPlaceMatch
						if tMatch is not None:
							_self["socket"].send(text_data=json.dumps({
								"nextMatch": {
									"p1_uid": tMatch.player1.uid,
									"p1_username": tMatch.player1.username,
									"p1_thumbnail": tMatch.player1.thumbnail.url,
									"p2_uid": tMatch.player2.uid,
									"p2_username": tMatch.player2.username,
									"p2_thumbnail": tMatch.player2.thumbnail.url
								}
							}))
				except Exception as e:
					print(f"An error occurred: {e}")
			case "match-invite":
				try:
					to_uid = textData["message"]["to"]
					userId = None
					for e in connected_users:
						if e["socket"] == self:
							userId = e["user_uid"]
					user = UserManage.objects.get(uid=userId)
					to_user = UserManage.objects.get(uid=to_uid)
					if BlockList.isBlocked(user, to_user):
						return
					if textData["message"]["gamemode"] not in ["classic", "powerups", "boosted"]:
						return
					gameMode = textData["message"]["gamemode"]
					invite = GameInvite.objects.filter(inviter=user, invited=to_user)
					if invite.exists():
						return
					invite = GameInvite.objects.create(inviter=user, invited=to_user, gamemode=gameMode)
					invite.save()
					for e in connected_users:
						if e["user_uid"] == to_uid:
							e["socket"].send(text_data=json.dumps({
								"matchInvite": {
									"from_uid": user.uid,
									"from_username": user.username,
									"from_displayname": user.displayname,
									"from_thumbnail": user.thumbnail.url
								}
							}))
				except Exception as e:
					print(e)
				pass
			case "gameAccept":
				try:
					from_uid = textData["message"]["from_uid"]
					from_user = UserManage.objects.get(uid=from_uid)
					userId = None
					for e in connected_users:
						if e["socket"] == self:
							userId = e["user_uid"]
					user = UserManage.objects.get(uid=userId)
					invite = GameInvite.objects.filter(inviter=from_user, invited=user)
					if invite.exists():
						game = Game(player1=from_user, player2=user, mode=invite[0].gamemode, status=Game.INGAME, startGameTimestamp=datetime.now() + timedelta(seconds=20))
						invite.delete()
						game.save()
						for e in connected_users:
							if e["user_uid"] == str(from_user.uid):
								e["socket"].send(text_data=json.dumps({
									"nextMatch": {
										"p1_uid": game.player1.uid,
										"p1_username": game.player1.username,
										"p1_thumbnail": game.player1.thumbnail.url,
										"p2_uid": game.player2.uid,
										"p2_username": game.player2.username,
										"p2_thumbnail": game.player2.thumbnail.url
									}
								}))
								self.send(text_data=json.dumps({
									"nextMatch": {
										"p1_uid": game.player1.uid,
										"p1_username": game.player1.username,
										"p1_thumbnail": game.player1.thumbnail.url,
										"p2_uid": game.player2.uid,
										"p2_username": game.player2.username,
										"p2_thumbnail": game.player2.thumbnail.url
									}
								}))
							
				except Exception as e:
					print(e)
			case "gameReject":
				try:
					from_uid = textData["message"]["from_uid"]
					from_user = UserManage.objects.get(uid=from_uid)
					userId = None
					for e in connected_users:
						if e["socket"] == self:
							userId = e["user_uid"]
					user = UserManage.objects.get(uid=userId)
					invite = GameInvite.objects.filter(inviter=from_user, invited=user)
					if invite.exists():
						invite.delete() 
				except Exception as e:
					print(e)

				
				

def userOnline(connected_user):
	sent_messages = Message.objects.filter(_from=connected_user)
	received_messages = Message.objects.filter(_to=connected_user)
	all_messages = sent_messages | received_messages
	friendShips = UserManage.objects.filter(Q(sent_messages__in=all_messages) | Q(received_messages__in=all_messages)).distinct()
	friendShips = friendShips.exclude(pk=connected_user.pk)
	for conUser in connected_users:
		for friend in friendShips:
			if conUser["user_uid"] == str(friend.uid):
				conUser["socket"].send(text_data=json.dumps({
					"user_uid": str(connected_user.uid),
					"onlineStatus": "online"
				}))

		#try:
		#	token = text_data_json['token']
		#	to_uid = text_data_json['to']
		#	message = text_data_json['message']
		#	uid = Token.objects.get(token=token).uid
		#	user = UserManage.objects.get(uid=uid)
		#	to_user = UserManage.objects.get(uid=to_uid)
		#	#if not is_blocked(user, to_user):
		#	#	Message.objects.create()
		#except:
		#	pass
		#message = text_data_json['message']
		#self.send(text_data=json.dumps({
		#	'message': message
		#}))

def tokenControl(self, text_data):
	token = Token.objects.get(token=text_data["token"])
	if not token:
		self.send(text_data=json.dumps({"unknown-token": ""}))
		return None  # Bu durumda bir değer döndürme
	elif not token.tokenCheck():
		token = token.generate_token()
		self.send(text_data=json.dumps({"generated-new-token": token.token}))
		return None  # Bu durumda bir değer döndürme
	return token  # Bu durumda token nesnesini döndürme


def fill_friends(token):
	_token = Token.objects.get(token=token)
	user = UserManage.objects.get(uid=_token.uid)
	_friends = []
	tmpUser = None
	sent_messages = Message.objects.filter(_from=user)
	received_messages = Message.objects.filter(_to=user)
	all_messages = sent_messages | received_messages
	friends = UserManage.objects.filter(Q(sent_messages__in=all_messages) | Q(received_messages__in=all_messages)).distinct()
	friends = friends.exclude(pk=user.pk)
	tmpFriendShips = Friendship.objects.filter(Q(user1=user) | Q(user2=user))
	tmpFriendList = []
	for tmpFr in tmpFriendShips:
		if tmpFr.user1 == user:
			tmpFriendList.append(tmpFr.user2)
		elif tmpFr.user2 == user:
			tmpFriendList.append(tmpFr.user1)
	friends = list(friends) + tmpFriendList
	friends = set(friends)

	# Arkadaşları son mesaj zamanına göre sırala
	friends = sorted(friends, key=lambda friend: all_messages.filter(Q(_from=user, _to=friend) | Q(_from=friend, _to=user)).order_by('-timestamp').first().timestamp
							if all_messages.filter(Q(_from=user, _to=friend) | Q(_from=friend, _to=user)).exists() else timezone.now(), reverse=True)
	print(friends)
	if friends:
		for tmpUser in friends:
			lastMessage = Message.objects.filter((Q(_from=user) & Q(_to=tmpUser)) |
			(Q(_from=tmpUser) & Q(_to=user))).order_by("-timestamp").first()
			if lastMessage != None:
				_lastMessage = lastMessage.content
			else:
				_lastMessage = ""
			print("Son mesaj:" + _lastMessage)
			onlineStatus = "offline"
			print(onlineStatus)
			print(connected_users)
			for conUser in connected_users:
				print(conUser["user_uid"])
				if conUser["user_uid"] == str(tmpUser.uid):
					onlineStatus = "online"
			isReaded = True
			if lastMessage != None and lastMessage._from == tmpUser and lastMessage.isReaded == False:
				isReaded = False
			_friends.append({
				"uid": tmpUser.uid,
				"username": tmpUser.username,
				"displayname": tmpUser.displayname,
				"thumbnail": tmpUser.thumbnail.url,
				"lastMessage": _lastMessage,
				"isReaded": str(isReaded),
				"onlineStatus": onlineStatus
			})
	return _friends

def message_history(token, _to_uid):
	try:
		to_uid = int(_to_uid)
		uid = Token.objects.get(token=token).uid#bu bizim kullanıcı
		user = UserManage.objects.get(uid=uid)
		to_user = UserManage.objects.get(uid=to_uid)#bu da diğer eleman
		onlineStatus = "offline"
		for conUser in connected_users:
			if conUser["user_uid"] == _to_uid:
				onlineStatus = "online"
		_message_history = {
			"to_thumbnail": to_user.thumbnail.url,
			"to_displayname": to_user.displayname,
			"to_username": to_user.username,
			"to_uid": str(to_user.uid),
			"to_onlineStatus": onlineStatus,
			"messages": []
			}
		messages = Message.objects.filter(_from=user, _to=to_user) | Message.objects.filter(_from=to_user, _to=user)#burada iki kişi arasındaki mesajlar mevcut !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		if messages:
			for message in messages:
				side = ""
				timestamp = None
				content = message.content#kim tarafından olduğu önemli olmadığı için direk atandı
				if message._from == user: #gönderen biz isek yönler vs ayarlanıyor
					side = "right"
					timestamp = str(message.timestamp)
				else:
					side = "left"
					timestamp = str(message.timestamp)
				_message_history["messages"].append({
					"side": side,
					"content": content,
					"timestamp": timestamp
				})
		return _message_history
	except Exception as e:
		print(str(e))
		return ""

def sendMessage(textData):
	try:
		_token = Token.objects.get(token=textData["token"])
		from_user = UserManage.objects.get(uid=_token.uid)#bu biziz
		to_uid = int(textData["message"]["to"])#elemanın uid
		to_user = UserManage.objects.get(uid=to_uid)
		message = {
			"from": str(from_user.uid),
			"to": str(to_user.uid),
			"content": "",
			"timestamp": ""
		}
		warning = ""
		if not BlockList.isBlocked(from_user, to_user) and Friendship.are_friends(from_user, to_user):
			if (len(textData["message"]["content"]) <= 0):
				return "Empty message!"
			msg = Message(_from=from_user, _to=to_user, content=textData["message"]["content"])
			msg.save()
			message = {
				"from": str(from_user.uid),
				"to": str(to_user.uid),
				"content": textData["message"]["content"],
				"timestamp": str(msg.timestamp)
			}
		elif not BlockList.isBlocked(from_user, to_user):
			warning = f"You are not friend with {to_user.displayname}"
		elif len(BlockList.objects.filter(blocker=from_user)) > 0:
			warning = f"You are blocked to {to_user.displayname}"
			print("burdayım2")
		else:
			print("burdayım")
			warning = f"You are blocked from {to_user.displayname}"
		return message, warning
	except Exception as e:
		print(str(e))
		return ""
