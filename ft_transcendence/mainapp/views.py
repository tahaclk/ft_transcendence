from django.shortcuts import render
from .models import UserManage

def func(request):
	taha = UserManage(name="Taha", surname="Çelik", username="tcelik")
	taha.save()
	return render(request, "index.html")
