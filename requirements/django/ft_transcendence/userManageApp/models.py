import random
from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.core.validators import FileExtensionValidator
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
from datetime import datetime, timedelta
from pytz import utc
import uuid
import copy

# Create your models here.
class UserManage(models.Model):
	uid = models.IntegerField(null=False, default=-1)
	name = models.CharField(max_length=50)
	surname = models.CharField(max_length=50)
	username = models.CharField(max_length=50)
	displayname = models.CharField(max_length=50)
	email = models.CharField(max_length=100)
	website = models.CharField(max_length=100)
	github = models.CharField(max_length=50)
	instagram = models.CharField(max_length=50)
	twitter = models.CharField(max_length=50)
	linkedin = models.CharField(max_length=50)
	imageLarge = models.ImageField(
		upload_to='profile_photos/',
		validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png'])]
	)
	thumbnail = models.ImageField(
		upload_to='profile_photos/',
		validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png'])]
	)
	imageSmall = models.ImageField(
		upload_to='profile_photos/',
		validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png'])]
	)

	def __str__(self):
		return f"{self.id} {self.uid} {self.name} {self.surname} {self.username} {self.displayname}"

	def save(self, *args, **kwargs):
		original_image = self.imageLarge
		imageSmall = self.create_thumbnail(original_image, size=(400, 400))
		thumbnail = self.create_thumbnail(original_image, size=(200, 200))
		self.imageSmall.save('small_' + original_image.name, imageSmall, save=False)
		self.thumbnail.save('thumbnail_' + original_image.name, thumbnail, save=False)
		super().save(*args, **kwargs)

	def create_thumbnail(self, image, size=(200, 200)):
		img = Image.open(image).convert('RGBA')
		img.thumbnail(size)
		thumb_io = BytesIO()
		img.save(thumb_io, format='PNG')
		thumbnail = InMemoryUploadedFile(thumb_io, None, 'temp.png', 'image/png', thumb_io.tell(), None)
		return thumbnail

class Message(models.Model):
	_from = models.ForeignKey(UserManage, on_delete=models.DO_NOTHING, related_name='sent_messages')
	_to = models.ForeignKey(UserManage, on_delete=models.DO_NOTHING, related_name='received_messages')
	content = models.TextField()
	isReaded = models.BooleanField(default=False)
	timestamp = models.DateTimeField(auto_now_add=True)

class Token(models.Model):
	uid = models.IntegerField()
	token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
	expiration_date = models.DateTimeField()
	def __str__(self):
		return str(self.token)

	def save(self, *args, **kwargs):
		if not self.expiration_date:
			now_utc = datetime.now()
			current_datetime_utc = now_utc.astimezone()
			expiration_date = current_datetime_utc + timedelta(days=14)
			self.expiration_date = expiration_date
		super().save(*args, **kwargs)

	def tokenCheck(self):
		now_utc = datetime.now()
		if now_utc < self.expiration_date:
			return True
		return False

	def generate_token(self):
		if self.tokenCheck():
			return self
		self.token = uuid.uuid4()
		now_utc = datetime.now(utc)
		current_datetime_utc = now_utc.astimezone()
		self.expiration_date = current_datetime_utc + timedelta(days=14)
		self.save()
		return self

class BlockList(models.Model):
	blocker = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='blocking')
	blocked = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='being_blocked')
	timestamp = models.DateTimeField(auto_now_add=True)
	class Meta:
		unique_together = ('blocker', 'blocked')
	@staticmethod
	def isBlocked(user_a, user_b):
		return BlockList.objects.filter(
			(models.Q(blocker=user_a) & models.Q(blocked=user_b)) |
			(models.Q(blocker=user_b) & models.Q(blocked=user_a))
		).exists()

class FriendshipRequest(models.Model):
	sender = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='sent_friend_requests')
	receiver = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='received_friend_requests')
	timestamp = models.DateTimeField(auto_now_add=True)
	class Meta:
		unique_together = ('sender', 'receiver')

class Friendship(models.Model):
	user1 = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='friends')
	user2 = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='_friends')
	timestamp = models.DateTimeField(auto_now_add=True)
	class Meta:
		unique_together = ('user1', 'user2')

	@staticmethod
	def are_friends(user_a, user_b):
		return Friendship.objects.filter(
			(models.Q(user1=user_a) & models.Q(user2=user_b)) |
			(models.Q(user1=user_b) & models.Q(user2=user_a))
		).exists()
	@staticmethod
	def delete_friendship(user_a, user_b):
		fs = Friendship.objects.filter((models.Q(user1=user_a) & models.Q(user2=user_b)) | (models.Q(user1=user_b) & models.Q(user2=user_a)))
		if fs.exists():
			fs.delete()
			return True
		return False

class Game(models.Model):
	SEARCHING = 1
	INVITED = 2
	INGAME = 3
	FINISHED = 0

	uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
	status = models.SmallIntegerField()
	mode = models.TextField(default="classic")
	player1 = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='player1')
	player2 = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='player2', null=True, blank=True)
	score1 = models.IntegerField(default=0)
	score2 = models.IntegerField(default=0)
	timestamp = models.DateTimeField(auto_now_add=True)
	startGameTimestamp = models.DateTimeField(null=True, blank=True)

	def save(self, *args, **kwargs):
		self.uuid = uuid.uuid4()
		if 'status' in kwargs:
			self.status = kwargs.pop('status')
		if 'mode' in kwargs:
			self.mode = kwargs.pop('mode')
		if 'player1' in kwargs:
			self.player1 = kwargs.pop('player1')
		if 'player2' in kwargs:
			self.player2 = kwargs.pop('player2')
		"""if self.status == Game.FINISHED:
			if self.score1 > self.score2:
				self.player1.stats.appendMatch(True, 0)
				self.player2.stats.appendMatch(False, 0)
			else:
				self.player1.stats.appendMatch(False, 0)
				self.player2.stats.appendMatch(True, 0)"""
		super().save(*args, **kwargs)

	@staticmethod
	def joinQuickMatch(user, mode="classic"):
		if Game.objects.filter(status=Game.SEARCHING, mode=mode).exclude(player1=user).exists():
			game = Game.objects.filter(status=Game.SEARCHING, mode=mode).exclude(player1=user).first()
			game.status = Game.INGAME
			game.player2 = user
			game.startGameTimestamp = datetime.now() + timedelta(seconds=10)
			game.save()
		else:
			game = Game(status=Game.SEARCHING, player1=user)
			game.save(mode=mode)
		return game

	@staticmethod
	def inviteMatch(user, invited_user, mode="classic"):
		if not Game.objects.filter(player1=user, player2=invited_user).exists():
			game = Game(status=Game.INVITED, player1=user, player2=invited_user)
			game.save(mode=mode)
			return game
		return None

	@staticmethod
	def acceptMatch(user, invited_user):
		if Game.objects.filter(player1=invited_user, player2=user).exists():
			game = Game.objects.get(player1=invited_user, player2=user)
			game.status = Game.INGAME
			game.save()
			return game
		return None

	def getTournamentObject(self):
		return Tournament.objects.filter(models.Q(semiMatch1=self) | models.Q(semiMatch2=self) | models.Q(finalMatch=self) | models.Q(thirdPlaceMatch=self)).first()

	def __str__(self):
		return f"{self.uuid} {self.status} {self.player1} {self.player2}"

class MatchStats(models.Model):
	game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='match_stats')
	gameMode = models.TextField(default="classic")
	user = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='player1_stats')
	enemy = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='player2_stats')
	scoredGoals = models.IntegerField(default=0)
	concededGoals = models.IntegerField(default=0)
	ballTouched = models.IntegerField(default=0)
	longestRoundTime = models.IntegerField(default=0)
	shortestRoundTime = models.IntegerField(default=999999999)
	allRoundTimes = ArrayField(models.IntegerField(), blank=True, default=list)
	catchedPowerUps = models.IntegerField(default=0)
	timestamp = models.DateTimeField(auto_now_add=True)

	def save(self, *args, **kwargs):
		for roundTime in self.allRoundTimes:
			if roundTime > self.longestRoundTime:
				self.longestRoundTime = roundTime
			if roundTime < self.shortestRoundTime:
				self.shortestRoundTime = roundTime
		super().save(*args, **kwargs)

	def __str__(self):
		return f"{self.game} {self.user} {self.enemy} {self.scoredGoals} {self.concededGoals} {self.ballTouched} {self.longestRoundTime} {self.shortestRoundTime} {self.allRoundTimes} {self.catchedPowerUps}"

class Tournament(models.Model):
	FINISHED = 0
	INPROGRESS = 1
	SEARCHINGPLAYERS = 2

	uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
	status = models.SmallIntegerField(default=SEARCHINGPLAYERS, null=False, blank=False)
	name = models.TextField(default="NULL",null=False, blank=False)
	mode = models.TextField(default="classic", null=False, blank=False)
	creator = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='creator', null=False, blank=False)
	p1 = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='p1', null=True, blank=True)
	p2 = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='p2', null=True, blank=True)
	p3 = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='p3', null=True, blank=True)
	p4 = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='p4', null=True, blank=True)
	finalMatchPlayer1 = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='finalMatchPlayer1', null=True, blank=True)
	finalMatchPlayer2 = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='finalMatchPlayer2', null=True, blank=True)
	thirdPlaceMatchPlayer1 = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='thirdPlacePlayer1', null=True, blank=True)
	thirdPlaceMatchPlayer2 = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='thirdPlacePlayer2', null=True, blank=True)
	winner = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='winner', null=True, blank=True)
	semiMatch1 = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='semiMatch1', null=True, blank=True)
	semiMatch2 = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='semiMatch2', null=True, blank=True)
	finalMatch = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='finalMatch', null=True, blank=True)
	thirdPlaceMatch = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='thirdPlaceMatch', null=True, blank=True)
	timestamp = models.DateTimeField(auto_now_add=True)
	sendNextMatchSwitch = models.BooleanField(default=False)

	def getPlayerCount(self):
		count = 0
		if self.p1:
			count += 1
		if self.p2:
			count += 1
		if self.p3:
			count += 1
		if self.p4:
			count += 1
		return count

	def isReadyForMatchMaking(self):
		if self.status == Tournament.SEARCHINGPLAYERS:
			if self.p1 and self.p2 and self.p3 and self.p4:
				return True
		return False

	def semiMatchMaker(self):
		self.status = Tournament.INPROGRESS
		tmp = [self.p1, self.p2, self.p3, self.p4]
		user1 = tmp[random.randint(0, 3)]
		tmp.remove(user1)
		user2 = tmp[random.randint(0, 2)]
		tmp.remove(user2)
		self.semiMatch1 = Game(player1=user1, player2=user2, mode=self.mode, status=Game.INGAME, startGameTimestamp=datetime.now() + timedelta(seconds=15))
		self.semiMatch1.save()
		user1 = tmp[random.randint(0, 1)]
		tmp.remove(user1)
		user2 = tmp[0]
		self.semiMatch2 = Game(player1=user1, player2=user2, mode=self.mode, status=Game.INGAME, startGameTimestamp=datetime.now() + timedelta(seconds=15))
		self.semiMatch2.save()
		self.save()

	def isSemiMatchsFinished(self):
		if self.semiMatch1 and self.semiMatch2 and self.semiMatch1.status == Game.FINISHED and self.semiMatch2.status == Game.FINISHED:
			return True
		return False

	def finalMatchMaker(self):
		if self.semiMatch1.score1 > self.semiMatch1.score2:
			self.finalMatchPlayer1 = self.semiMatch1.player1
			self.thirdPlaceMatchPlayer1 = self.semiMatch1.player2
		else:
			self.finalMatchPlayer1 = self.semiMatch1.player2
			self.thirdPlaceMatchPlayer1 = self.semiMatch1.player1
		if self.semiMatch2.score1 > self.semiMatch2.score2:
			self.finalMatchPlayer2 = self.semiMatch2.player1
			self.thirdPlaceMatchPlayer2 = self.semiMatch2.player2
		else:
			self.finalMatchPlayer2 = self.semiMatch2.player2
			self.thirdPlaceMatchPlayer2 = self.semiMatch2.player1
		self.finalMatch = Game(player1=self.finalMatchPlayer1, player2=self.finalMatchPlayer2, mode=self.mode, status=Game.INGAME, startGameTimestamp=datetime.now() + timedelta(seconds=15))
		self.finalMatch.save()
		self.thirdPlaceMatch = Game(player1=self.thirdPlaceMatchPlayer1, player2=self.thirdPlaceMatchPlayer2, mode=self.mode, status=Game.INGAME, startGameTimestamp=datetime.now() + timedelta(seconds=15))
		self.thirdPlaceMatch.save()
		self.save()

	def isFinalMatchsFinished(self):
		if self.finalMatch and self.thirdPlaceMatch and self.finalMatch.status == Game.FINISHED and self.thirdPlaceMatch.status == Game.FINISHED:
			return True
		return False

	def tournamentOrder(self):
		tmp = []
		if self.finalMatch.score1 > self.finalMatch.score2:
			self.winner = self.finalMatchPlayer1
			tmp.append(copy.deepcopy(self.finalMatchPlayer1))
			tmp.append(copy.deepcopy(self.finalMatchPlayer2))
		else:
			self.winner = self.finalMatchPlayer2
			tmp.append(copy.deepcopy(self.finalMatchPlayer2))
			tmp.append(copy.deepcopy(self.finalMatchPlayer1))
		if self.thirdPlaceMatch.score1 > self.thirdPlaceMatch.score2:
			tmp.append(copy.deepcopy(self.thirdPlaceMatchPlayer1))
			tmp.append(copy.deepcopy(self.thirdPlaceMatchPlayer2))
		else:
			tmp.append(copy.deepcopy(self.thirdPlaceMatchPlayer2))
			tmp.append(copy.deepcopy(self.thirdPlaceMatchPlayer1))
		self.p1 = tmp[0]
		self.p2 = tmp[1]
		self.p3 = tmp[2]
		self.p4 = tmp[3]
		self.status = Tournament.FINISHED
		self.save()

	def isOrdered(self):
		if self.winner:
			return True
		return False

	def doNextStep(self, game):
		self.sendNextMatchSwitch = False
		self.save()
		if self.isOrdered():
			return
		elif self.isFinalMatchsFinished():
			self.tournamentOrder()
		elif self.isSemiMatchsFinished() and (game.id == self.semiMatch1.id or game.id == self.semiMatch2.id):
			self.sendNextMatchSwitch = True
			self.save()
			self.finalMatchMaker()

	def save(self, *args, **kwargs):
		if self.uuid == None:
			self.uuid = uuid.uuid4()
		super().save(*args, **kwargs)

	def __str__(self):
		return f"{self.uuid} {self.status} {self.name}"

class TournamentInvite(models.Model):
	tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='tournament_invites')
	inviter = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='tournament_inviter')
	invited = models.ForeignKey(UserManage, on_delete=models.CASCADE, related_name='tournament_invited')
	timestamp = models.DateTimeField(auto_now_add=True)
