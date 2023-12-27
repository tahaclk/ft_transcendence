from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.core.exceptions import ObjectDoesNotExist
from .models import UserManage
import requests
import environ
from json import dumps
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
env_file_path = BASE_DIR / '.env'
env = environ.Env()
environ.Env.read_env(env_file=env_file_path)

BASE_URL = env("SITE")

def index(request):
	return render(request, "index.html")

def fetch_data(endpoint, token, params=None):
	url = f"{BASE_URL}{endpoint}"
	headers = {
		"Authorization": f"Bearer {token}",
		"Content-Type": "application/json",
	}
	response = requests.get(url, headers=headers, params=params)
	if response.status_code == 200:
		return response.json()
	else:
		print(f"Veri çekilemedi. Hata kodu: {response.status_code}")
		return None

def userExist(user_id):
	try:
		user = UserManage.objects.get(uid=user_id)
		return True
	except ObjectDoesNotExist:
		return False

def getUserInfo(request):
	code = request.GET.get("code")
	data = {
		"grant_type": "authorization_code",
		"client_id": env("UID"),
		"client_secret": env("SECRET"),
		"code": code,
		"redirect_uri": "https://valid-burro-vigorously.ngrok-free.app/getUserInfo"
	}
	access_token = ""
	token_url = f"{BASE_URL}/oauth/token"
	response = requests.post(token_url, data=data)
	if response.status_code == 200:
		access_token = response.json().get("access_token")
	else:
		print("Token alınamadı. Hata kodu:", response.status_code)
	print("TOKEN: " + access_token)
	print("code:" + code)
	cursus_data = fetch_data("/v2/me", access_token)
	print(dumps(cursus_data))
	if (userExist(user_id=cursus_data['id']) == False):
		print("KULLANICI KAYDEDİLİYOR")
		saveUser(cursus_data)
	else:
		user = UserManage.objects.get(uid=cursus_data['id'])
		print("Kullanıcı zaten mevcut!\nKayıtlı kullanıcı: " + str(user))
	return render(request, "index.html")

def saveUser(cursus_data):
	try:
		new_user = UserManage(
			uid=cursus_data['id'],
			name=cursus_data['first_name'],
			surname=cursus_data['last_name'],
			username=cursus_data['login'],
			displayname=cursus_data['displayname'])
		new_user.save()
	except:
		print("Kullanıcı kaydedilirken bir hata ile karşılaşıldı!")
