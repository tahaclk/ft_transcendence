import requests
import environ
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
env_file_path = BASE_DIR / '.env'
env = environ.Env()
environ.Env.read_env(env_file=env_file_path)

UID = env("UID")
SECRET = env("SECRET")
BASE_URL = env("SITE")

def get_token():
    token_url = f"{BASE_URL}/oauth/token"
    data = {
        "grant_type": "client_credentials",
        "client_id": UID,
        "client_secret": SECRET,
    }

    response = requests.post(token_url, data=data)
    if response.status_code == 200:
        token = response.json().get("access_token")
        return token
    else:
        print("Token alınamadı. Hata kodu:", response.status_code)
        return None

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

access_token = get_token()

print(access_token)

if access_token:
    # Örnek: Cursus verilerini çek
    cursus_data = fetch_data("/v2/me", access_token)
    print("Tcelik Data:", cursus_data)

    # Örnek: Cursus 42'deki kullanıcıları çek
    #users_in_cursus = fetch_data("/v2/cursus/42/users", access_token, params={"page[number]": 1})
    #print("Users in Cursus 42:", users_in_cursus)
