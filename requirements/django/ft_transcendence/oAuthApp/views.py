from pathlib import Path
from json import dumps
from userManageApp.models import UserManage, Token
from userManageApp.views import saveUser,userExist
import requests
import environ

BASE_DIR = Path(__file__).resolve().parent.parent
env_file_path = BASE_DIR / '.env'
env = environ.Env()
environ.Env.read_env(env_file=env_file_path)

BASE_URL = env("SITE")
SITE_URL = env("SITE_URL")

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

def apiRegisterUser(request):
	code = request.GET.get("code")
	data = {
		"grant_type": "authorization_code",
		"client_id": env("UID"),
		"client_secret": env("SECRET"),
		"code": code,
		"redirect_uri": SITE_URL + "/getUserInfo"
	}
	access_token = ""
	token_url = f"{BASE_URL}/oauth/token"
	response = requests.post(token_url, data=data)
	if response.status_code == 200:
		access_token = response.json().get("access_token")
	else:
		print("Token alınamadı. Hata kodu:", response.status_code)
	print("Token: " + access_token)
	print("Code:" + code)
	cursus_data = fetch_data("/v2/me", access_token)
	user = None
	print(dumps(cursus_data))
	if (userExist(user_id=cursus_data['id']) == False):
		print("Kullanıcı kaydediliyor.")
		user = saveUser(cursus_data)
		token = Token(
			uid=user.uid
		)
		token.save()
		request.session['intra_uid'] = user.uid
	else:
		user = UserManage.objects.get(uid=cursus_data['id'])
		Token.objects.get(uid=cursus_data['id']).generate_token()
		request.session['intra_uid'] = user.uid
		print("Kullanıcı zaten mevcut!\nKayıtlı kullanıcı: " + str(user))
	return request

""" def set_cookie(response, key, value, days_expire=7):
    if days_expire is None:
        max_age = 365 * 24 * 60 * 60  # one year
    else:
        max_age = days_expire * 24 * 60 * 60
    expires = datetime.datetime.strftime(
        datetime.datetime.utcnow() + datetime.timedelta(seconds=max_age),
        "%a, %d-%b-%Y %H:%M:%S GMT",
    )
    response.set_cookie(
        key,
        value,
        max_age=max_age,
        expires=expires,
        domain=settings.SESSION_COOKIE_DOMAIN,
        secure=settings.SESSION_COOKIE_SECURE or None,
    ) """

""" from django.http import HttpResponse

def my_view(request):
    # İlgili çerez bilgilerini ayarla
    response = HttpResponse("Merhaba dünya!")

    # Çerez eklemek için response.set_cookie kullanın
    response.set_cookie('kullanici', 'john_doe')

    return response
 """
