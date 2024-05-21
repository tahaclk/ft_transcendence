from django.urls import path
from viewApi.views import home, about, profile, editProfile, game, matchs, joinTournament

urlpatterns = [
    path('home', home),
    path('about', about),
    path('profile', profile),
    path('edit-profile', editProfile),
	path('user/<slug:username>', profile),
	path('game', game),
    path('join-tournament', joinTournament),
    path('matchs/<slug:username>', matchs)
]
