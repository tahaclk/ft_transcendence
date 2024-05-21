from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError
from userManageApp.models import UserManage, FriendshipRequest, Friendship, BlockList
from django.http import HttpResponse, JsonResponse, HttpResponseBadRequest
from userManageApp.forms import AvatarUpdateForm
from django.shortcuts import get_object_or_404
from django.core.files.base import ContentFile
import json
import requests
import os

def userExist(user_id):
	try:
		user = UserManage.objects.get(uid=user_id)
		return True
	except ObjectDoesNotExist:
		return False

exclude_fields = ['id', 'uid', 'name', 'surname', 'displayname',
				'imageLarge', 'thumbnail', 'imageSmall']

def are_arrays_equal(arr1, arr2):
	if len(arr1) != len(arr2):
		return False
	for item1, item2 in zip(arr1, arr2):
		if item1 != item2:
			return False
	return True

def updateUser(uid2, data):
	modelFields = [field.name for field in UserManage._meta.fields if field.name not in exclude_fields]
	print(modelFields)
	print(data.keys())
	if are_arrays_equal(modelFields, data.keys()) == False:
		raise Exception("Sent data model does not match!")
	elif UserManage.objects.filter(username=data["username"]).exclude(uid=uid2).exists():
		raise Exception("Username already taken!")
	print(data)
	UserManage.objects.filter(uid=uid2).update(**data)
	return

def updateUserView(request):
	if request.method == 'POST':
		tmp = json.loads(str(request.POST.get("formData")))
		data = dict()
		try:
			for node in tmp:
				if (node["name"] != "csrfmiddlewaretoken"):
					data.update({node["name"]: node["value"]})
			if 'intra_uid' in request.session:
				uid2 = request.session['intra_uid']
				print(data)
				updateUser(uid2, data)
			return JsonResponse({'status': 'success', 'message': 'Form verisi başarıyla alındı.'})
		except Exception as e:
			print(str(e))
			return JsonResponse({'status': 'error', 'message': 'Form verisi alma hatası: {}'.format(str(e))})
	else:
		return JsonResponse({'status': 'error', 'message': 'Sadece POST istekleri kabul edilir.'})

def updateAvatar(request):
	if request.method == 'POST':
		form = AvatarUpdateForm(request.POST, request.FILES)
		if form.is_valid():
			uid2 = request.session.get('intra_uid')
			user = get_object_or_404(UserManage, uid=uid2)

			if user.imageLarge:
				delete_file(user.imageLarge.path)
			if user.imageSmall:
				delete_file(user.imageSmall.path)
			if user.thumbnail:
				delete_file(user.thumbnail.path)

			user.imageLarge = form.cleaned_data['uploadfile']
			user.save()
			return JsonResponse({'status': 'success', 'message': 'Avatar başarıyla kaydedildi.'})
		else:
			print("FORM GEÇERSİZ")
	else:
		form = AvatarUpdateForm()
	return JsonResponse({'status': 'error', 'message': 'Avatar yüklenirken bir hata ile karşılaşıldı.'})

def saveUser(cursus_data):
	try:
		# Diğer alanlar
		image_url = cursus_data['image']['versions']['large']

		# Fotoğrafı indir ve modeldeki imageLarge alanına ata
		image_response = requests.get(image_url)
		if image_response.status_code == 200:
			new_user = UserManage(
				uid=cursus_data['id'],
				name=cursus_data['first_name'],
				surname=cursus_data['last_name'],
				username=cursus_data['login'],
				displayname=cursus_data['displayname']
			)
			
			#User ile birlikte bir stats objesi oluştur
			"""new_user_stats = UserStats.objects.create(user=new_user)
			new_user_stats.save()"""
		
			# Resmi modeldeki imageLarge alanına ata
			new_user.imageLarge.save(f"{new_user.username}_large.jpg", ContentFile(image_response.content), save=False)
			new_user.save()
			print(new_user)
			return new_user
		else:
			print(f"Fotoğraf indirme başarısız! HTTP Hata Kodu: {image_response.status_code}")
			return None
	except Exception as e:
		print("Kullanıcı kaydedilirken bir hata ile karşılaşıldı!")
		print(f"Hata Detayı: {e}")
		return None

class AlreadyFriend(Exception):
	def __init__(self, message="You are already friends with the person you sent the request to"):
		self.message = message
		super().__init__(self.message)

def friend_request(request):
	try:
		if 'intra_uid' in request.session:
			fromUid = request.session['intra_uid']
			_from = UserManage.objects.get(uid=fromUid)
			if request.method == 'POST':
				toUid = int(request.POST["uid"])
				_to = UserManage.objects.get(uid=toUid)
				method = request.POST["method"]
				match method:
					case "sendRequest":
						if Friendship.are_friends(_from, _to):
							raise AlreadyFriend
						fq = FriendshipRequest.objects.create(sender=_from, receiver=_to)
						fq.save()
					case "cancelRequest":
						fq = FriendshipRequest.objects.filter(sender=_from, receiver=_to)
						if fq.exists():
							fq.delete()
					case "unfriendRequest":
						Friendship.delete_friendship(_from, _to)
					case "acceptRequest":
						fq = FriendshipRequest.objects.filter(sender=_to, receiver=_from)
						if fq.exists():
							fq.delete()
							newFq = Friendship.objects.create(user1=_to, user2=_from)
							newFq.save()
					case "declineRequest":
						fq = FriendshipRequest.objects.filter(sender=_to, receiver=_from)
						if fq.exists():
							fq.delete()
					case _:
						pass
	except AlreadyFriend as e:
		return HttpResponseBadRequest(str(e), status="401")
	except IntegrityError as e:
		if 'duplicate key value' in str(e):
			return HttpResponseBadRequest("Duplicate key value error!", status="402")
		return HttpResponseBadRequest(str(e))
	except ObjectDoesNotExist as e:
		return HttpResponseBadRequest("Object not found!")
	except Exception as e:
		return HttpResponseBadRequest(str(e))
	return JsonResponse({"status": "200", "message": "Success"})

def blockRequest(request):
	try:
		if 'intra_uid' in request.session:
			fromUid = request.session['intra_uid']
			_from = UserManage.objects.get(uid=fromUid)
			if request.method == 'POST':
				toUid = int(request.POST["uid"])
				_to = UserManage.objects.get(uid=toUid)
				method = request.POST["method"]
				match method:
					case "block":
						bl = BlockList.objects.filter(blocker=_from, blocked=_to)
						if not bl.exists():
							newBl = BlockList.objects.create(blocker=_from, blocked=_to)
							newBl.save()
					case "unblock":
						bl = BlockList.objects.filter(blocker=_from, blocked=_to)
						if bl.exists():
							bl.delete()
					case _:
						pass
	except IntegrityError as e:
		if 'duplicate key value' in str(e):
			return HttpResponseBadRequest("Duplicate key value error!", status="402")
		return HttpResponseBadRequest(str(e))
	except ObjectDoesNotExist as e:
		return HttpResponseBadRequest("Object not found!")
	except Exception as e:
		return HttpResponseBadRequest(str(e))
	return JsonResponse({"status": "200", "message": "Success"})

def delete_file(file_path):
	# Dosya varsa sil
	if os.path.exists(file_path):
		os.remove(file_path)
	else:
		print("File not found: " + file_path)
