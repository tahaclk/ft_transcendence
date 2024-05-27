from django.http import JsonResponse, HttpResponse, HttpResponseForbidden, HttpResponseNotFound
from django.core.exceptions import PermissionDenied
from oAuthApp.views import apiRegisterUser
from django.shortcuts import render, redirect, get_object_or_404
from userManageApp.models import Game, UserManage, Token, MatchStats, Tournament
from django.db.models import F, Sum, Q
from viewApi.views import blockFriendStatus
from mainapp.language import getLangTexts
import environ
from json import load as jsonLoad
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
env_file_path = BASE_DIR / '.env'
env = environ.Env()
environ.Env.read_env(env_file=env_file_path)

BASE_URL = env("SITE")
SITE_URL = env("SITE_URL")
REDIRECT_URI = env("REDIRECT_URI")

publicPaths = [
	"home",
	"about",
	"local-game"
]

unsecurePaths = [
	"profile",
	"edit-profile",
	"game",
	"matchs",
	"join-tournament",
	"tournament-history",
]

def index(request, direct="", dir=""):
	bs, fs = "nonBlock", "none"
	print("direct: " + direct)
	print("dir: " + dir)
	if dir == "user":
		langTexts, language = getLangTexts(request, 'profile')
	elif dir == "matchs":
		langTexts, language = getLangTexts(request, 'matchs')
	else:
		langTexts, language = getLangTexts(request, (direct if direct != "" else 'home'))
	print("langTexts:" + str(langTexts))
	if 'intra_uid' in request.session:
		sessionValue = request.session['intra_uid']
		matchs = None
		stats={}
		if dir == "user":
			user = get_object_or_404(UserManage, username=direct)
			bs, fs = blockFriendStatus(sessionValue, user)
			direct = "profile"
		elif dir == "matchs":
			user = get_object_or_404(UserManage, username=direct)
			matchs = MatchStats.objects.filter(user=user).order_by('-id')
			for match in matchs:
				for i,time in enumerate(match.allRoundTimes):
					match.allRoundTimes[i] = '{0:.2f}'.format(time / 1000.0)
				match.longestRoundTime = '{0:.2f}'.format(match.longestRoundTime / 1000.0)
				match.shortestRoundTime = '{0:.2f}'.format(match.shortestRoundTime / 1000.0)
			direct = "matchs"
		else:
			user = UserManage.objects.get(uid=sessionValue)
		if direct == "profile" or dir=="user":
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
		tournament_history = None
		if direct == "tournament-history":
			try:
				user = UserManage.objects.get(uid=sessionValue)
				tournament_history = Tournament.objects.filter(Q(p1=user) | Q(p2=user) | Q(p3=user) | Q(p4=user)).order_by('-id')
			except:
				pass
		if direct not in (publicPaths + unsecurePaths) and direct != "":
			return HttpResponseNotFound()
		response = render(request, "index.html", {
			"blockStatus": bs,
			"friendshipStatus": fs,
			"ownerUser": UserManage.objects.get(uid=sessionValue),
			"user": user,
			"direct": "utils/" + direct,
			"urls": {"REDIRECT_URI": REDIRECT_URI, "URL": SITE_URL},
			"langTexts": langTexts,
			"matchs": matchs,
			"stats": stats,
			"tournaments": tournament_history
		})
		response.set_cookie("language", language, max_age=31536000, secure=True)
		response.set_cookie("token", Token.objects.get(uid=sessionValue).generate_token(), secure=True)
		return response

	if direct in unsecurePaths or dir == "user" or dir == "matchs":
		response = render(request, "index.html", {
			"ownerUser": None,
			"user": None,
			"direct": "utils/accessDenied",
			"urls": {"REDIRECT_URI" : REDIRECT_URI, "URL": SITE_URL},
			"langTexts": langTexts
		})
	else:
		if direct not in publicPaths and direct != "":
			return HttpResponseNotFound()
		else:
			response = render(request, "index.html", {
				"ownerUser": None,
				"user": None,
				"direct": "utils/" + direct,
				"urls": {"REDIRECT_URI" : REDIRECT_URI, "URL": SITE_URL},
				"langTexts": langTexts
			})
	response.set_cookie("language", language, max_age=31536000, secure=True)
	return response

def logout(request):
	request.session.flush()
	return redirect("/")

def getUserInfo(request):
	user = None
	if 'intra_uid' in request.session:
		return redirect("/")
	else:
		request = apiRegisterUser(request)
		try:
			print("session: " + request.session['intra_uid'])
			user = UserManage.objects.get(uid=int(request.session['intra_uid']))
			request.session['intra_uid'] = user.uid
			return redirect("/")
		except:
			return redirect("/")
