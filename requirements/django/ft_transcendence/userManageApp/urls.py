from django.urls import path
from userManageApp.views import friend_request, blockRequest

urlpatterns = [
	path('sendRequest', friend_request),
	path('blockRequest', blockRequest),
]
