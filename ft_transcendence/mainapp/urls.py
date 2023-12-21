from django.urls import path
from . import views

urlpatterns = [
	path("ekle/", views.func),
]

