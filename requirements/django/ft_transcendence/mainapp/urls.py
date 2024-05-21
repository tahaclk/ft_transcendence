from django.urls import path
from . import views
from userManageApp.views import updateUserView, updateAvatar
from django.conf import settings
from django.conf.urls.static import static
urlpatterns = [
	path("", views.index),
	path("getUserInfo", views.getUserInfo),
	path("logout", views.logout),
	path("update-user", updateUserView),
	path("update-avatar", updateAvatar),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
