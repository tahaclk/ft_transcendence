from django.shortcuts import render
from django.shortcuts import get_object_or_404
from django.db.models import F, Sum, Q
from userManageApp.models import UserManage, Friendship, FriendshipRequest, BlockList, Game, MatchStats
from mainapp.language import getLangTexts

import environ
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
env_file_path = BASE_DIR / '.env'
env = environ.Env()
environ.Env.read_env(env_file=env_file_path)

REDIRECT_URI = env("REDIRECT_URI")
SITE_URL = env("SITE_URL")


def home(request):
	langTexts = getLangTexts(request, "home")[0]
	if 'intra_uid' in request.session:
		sessionValue = request.session['intra_uid']
		user = UserManage.objects.get(uid=sessionValue)
		return render(request, "utils/home.html", {
			"ownerUser": UserManage.objects.get(uid=sessionValue),
			"user": user,
			"urls": {"REDIRECT_URI" : REDIRECT_URI, "URL": SITE_URL},
			"langTexts": langTexts
		})
	return render(request, "utils/home.html", {
		"ownerUser": None,
		"user": None,
		"urls": {"REDIRECT_URI" : REDIRECT_URI, "URL": SITE_URL},
		"langTexts": langTexts
	})

def about(request):
	langTexts = getLangTexts(request, "about")[0]
	if 'intra_uid' in request.session:
		sessionValue = request.session['intra_uid']
		user = UserManage.objects.get(uid=sessionValue)
		return render(request, "utils/about.html", {
			"ownerUser": UserManage.objects.get(uid=sessionValue),
			"user": user,
			"urls": {"REDIRECT_URI" : REDIRECT_URI, "URL": SITE_URL},
			"langTexts": langTexts
		})
	return render(request, "utils/about.html", {
		"ownerUser": None,
		"user": None,
		"urls": {"REDIRECT_URI" : REDIRECT_URI, "URL": SITE_URL},
		"langTexts": langTexts
	})

def blockFriendStatus(sessionValue, user):
	blockStatus = "nonBlocked"
	friendshipStatus = "none"
	ownerUser = get_object_or_404(UserManage, uid=sessionValue)
	if BlockList.objects.filter(blocker=ownerUser, blocked=user).exists():
		blockStatus = "blocked"
	else:
		blockStatus = "nonBlocked"
	if BlockList.objects.filter(blocker=user, blocked=ownerUser).exists():
		friendshipStatus = "blocked"
	elif Friendship.are_friends(user, ownerUser):
		friendshipStatus = "friend"
	else:
		friendshipRequest = FriendshipRequest.objects.filter(sender=ownerUser, receiver=user)
		if friendshipRequest.exists():
			friendshipStatus = "sended"
		else:
			friendshipRequest = FriendshipRequest.objects.filter(sender=user, receiver=ownerUser)
			if friendshipRequest.exists():
				friendshipStatus = "received"
			else:
				friendshipStatus = "none"
	return blockStatus, friendshipStatus

def editProfile(request):
	langTexts = getLangTexts(request, "edit-profile")[0]
	if 'intra_uid' in request.session:
		sessionValue = request.session['intra_uid']
		user = UserManage.objects.get(uid=sessionValue)
		return render(request, "utils/edit-profile.html", {
			"ownerUser": UserManage.objects.get(uid=sessionValue),
			"user": user,
			"urls": {"REDIRECT_URI" : REDIRECT_URI, "URL": SITE_URL},
			"langTexts": langTexts
		})
	return render(request, "utils/home.html", {
		"ownerUser": None,
		"user": None,
		"urls": {"REDIRECT_URI" : REDIRECT_URI, "URL": SITE_URL},
		"langTexts": langTexts
	})

def game(request):
	langTexts = getLangTexts(request, "game")[0]
	if 'intra_uid' in request.session:
		sessionValue = request.session['intra_uid']
		user = UserManage.objects.get(uid=sessionValue)
		return render(request, "utils/game.html", {
			"ownerUser": UserManage.objects.get(uid=sessionValue),
			"user": user,
			"urls": {"REDIRECT_URI" : REDIRECT_URI, "URL": SITE_URL},
			"langTexts": langTexts
		})
	return render(request, "utils/game.html", {
		"ownerUser": None,
		"user": None,
		"urls": {"REDIRECT_URI" : REDIRECT_URI, "URL": SITE_URL},
		"langTexts": langTexts
	})

def joinTournament(request):
	langTexts = getLangTexts(request, "join-tournament")[0]
	if 'intra_uid' in request.session:
		sessionValue = request.session['intra_uid']
		user = UserManage.objects.get(uid=sessionValue)
		return render(request, "utils/join-tournament.html", {
			"ownerUser": UserManage.objects.get(uid=sessionValue),
			"user": user,
			"urls": {"REDIRECT_URI" : REDIRECT_URI, "URL": SITE_URL},
			"langTexts": langTexts
		})
	return render(request, "utils/join-tournament.html", {
		"ownerUser": None,
		"user": None,
		"urls": {"REDIRECT_URI" : REDIRECT_URI, "URL": SITE_URL},
		"langTexts": langTexts
	})

def profile(request, username=None):
	langTexts = getLangTexts(request, "profile")[0]
	if 'intra_uid' in request.session:
		sessionValue = request.session['intra_uid']
		bs = "nonBlocked"
		fs = "none"
		if username:
			user = get_object_or_404(UserManage, username=username)
			bs, fs = blockFriendStatus(sessionValue, user)
		else:
			user = UserManage.objects.get(uid=sessionValue)
		stats={}
		stats["totalMatchs"] = Game.objects.filter(Q(player1=user) | Q(player2=user)).count()
		stats["totalWins"] = Game.objects.filter(Q(player1=user, score1__gt=F('score2')) | Q(player2=user, score2__gt=F('score1'))).count()
		stats["totalLoses"] = Game.objects.filter(Q(player1=user, score1__lt=F('score2')) | Q(player2=user, score2__lt=F('score1'))).count()
		try:
			stats["totalGoal"] = Game.objects.filter(player1=user).aggregate(Sum('score1'))['score1__sum'] + Game.objects.filter(player2=user).aggregate(Sum('score2'))['score2__sum']
		except:
			stats["totalGoal"] = 0
		match_stats_objects = MatchStats.objects.filter(user=user)
		stats["playTime"] = 0
		for match_stats in match_stats_objects:
			stats["playTime"] += sum(match_stats.allRoundTimes)
		stats["playTime"] = '{0:.2f}'.format(stats["playTime"] / 60000.0)
		return render(request, "utils/profile.html", {
			"blockStatus": bs,
			"friendshipStatus": fs,
			"ownerUser": UserManage.objects.get(uid=sessionValue),
			"user": user,
			"urls": {"REDIRECT_URI" : REDIRECT_URI, "URL": SITE_URL},
			"myuid": sessionValue,
			"langTexts": langTexts,
			"stats": stats
		})
	return render(request, "utils/home.html", {
		"ownerUser": None,
		"user": None,
		"urls": {"REDIRECT_URI" : REDIRECT_URI, "URL": SITE_URL},
		"langTexts": langTexts
	})

def matchs(request, username=None):
	langTexts = getLangTexts(request, "matchs")[0]
	if 'intra_uid' in request.session:
		sessionValue = request.session['intra_uid']
		bs = "nonBlocked"
		fs = "none"
		if username:
			user = get_object_or_404(UserManage, username=username)
			bs, fs = blockFriendStatus(sessionValue, user)
		else:
			user = UserManage.objects.get(uid=sessionValue)
		matchs = MatchStats.objects.filter(user=user).order_by('-id')
		for match in matchs:
			for i,time in enumerate(match.allRoundTimes):
				match.allRoundTimes[i] = '{0:.2f}'.format(time / 1000.0)
			match.longestRoundTime = '{0:.2f}'.format(match.longestRoundTime / 1000.0)
			match.shortestRoundTime = '{0:.2f}'.format(match.shortestRoundTime / 1000.0)
		return render(request, "utils/matchs.html", {
			"blockStatus": bs,
			"friendshipStatus": fs,
			"ownerUser": UserManage.objects.get(uid=sessionValue),
			"user": user,
			"urls": {"REDIRECT_URI" : REDIRECT_URI, "URL": SITE_URL},
			"myuid": sessionValue,
			"langTexts": langTexts,
			"matchs": matchs
		})
	return render(request, "utils/home.html", {
		"ownerUser": None,
		"user": None,
		"urls": {"REDIRECT_URI" : REDIRECT_URI, "URL": SITE_URL},
		"langTexts": langTexts
	})
