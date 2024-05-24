from pathlib import Path
from json import load as jsonLoad

def setLanguage(request):
	language = request.COOKIES.get("language")
	if not language or language not in ["en", "tr", "de"]:
		print("Language not found or invalid. Setting to English.")
		language = "en"
	return language

def getLangTexts(request, direct):
	language = setLanguage(request)
	print("Language set to", language)
	try:
		base_path = Path('/vol')
		with open(base_path / 'static' / 'lang' / direct / f'{language}.json', 'r') as file:
			with open(base_path / 'static' / 'lang' / 'navbar' / f'{language}.json', 'r') as navbar:
				navbarTexts = jsonLoad(navbar)
			with open(base_path / 'static' / 'lang' / 'chat' / f'{language}.json', 'r') as chat:
				chatTexts = jsonLoad(chat)
			langTexts = jsonLoad(file)
			langTexts.update(navbarTexts)
			langTexts.update(chatTexts)
	except:
		return {}, language
	return langTexts, language