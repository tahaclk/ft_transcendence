from django.urls import path
from viewApi.views import tournamentInfoGetter

urlpatterns = [
    path('<int:tournamentId>', tournamentInfoGetter)
]
