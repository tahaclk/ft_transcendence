class EditProfile{
	constructor(){
		this.eProfileJson = {
			"en":{
				"alert": "Please upload jpeg, jpg or png file!",
				"success": "Changes saved successfully!",
				"error": "An unexpected error occurred!",
				"_okay": "Okay"
			},
			"tr":{
				"alert": "Lütfen jpeg, jpg veya png dosyası yükleyin!",
				"success": "Değişiklikler başarıyla kaydedildi!",
				"error": "Beklenmeyen bir hata ile karşılaşıldı!",
				"_okay": "Tamam"
			},
			"de":{
				"alert": "Bitte laden Sie eine jpeg-, jpg- oder png-Datei hoch!",
				"success": "Änderungen erfolgreich gespeichert!",
				"error": "Ein unerwarteter Fehler ist aufgetreten!",
				"_okay": "Okay"
			}
		};
		this.image = $('#imageview img');
		this.imageSrc = this.image.attr("src");
		this.tmp = $("#uploadfile").val();

		$(document).ready(function(){
			editProfile.editProfileReload();
		});
	}

	checkExtension(file) {
		var allowedExtensions = ["jpg", "jpeg", "png"];
		var fileName = file.name.toLowerCase();
		var fileExtension = fileName.split('.').pop();
		if (allowedExtensions.indexOf(fileExtension) === -1) {
			return false;
		}
		return true;
	}

	statusPopup(status){
		if (status == 'success'){
			$('#dataPopup').html(`\
			<div class='popupLine'>\
			<div>\
			<i class='fa-solid fa-circle-check'></i>\
			</div>\
			</div>\
			<div class='popupContent'>\
			<div class='popupMessage'>${this.eProfileJson[chat.getCookie("language")].success}</div>\
			<div class='popup-btn'>\
			<button type='button' class='btn btn-success mb-3'>${this.eProfileJson[chat.getCookie("language")]._okay}</button>\
			</div>\
			</div>`);
			$('.popup-btn button').click(function(){
				$('#dataPopup').css('display', 'none');
				$('#dataPopup').html('');
			});
			$('.popupLine div:nth-child(1) i').css('color', '#4caf50');
			$('#dataPopup').css('display', 'flex');
		}else{
			$('#dataPopup').html(`\
			<div class='popupLine'>\
				<div>\
					<i class='fa-solid fa-circle-xmark'></i>\
				</div>\
			</div>\
			<div class='popupContent'>\
				<div class='popupMessage'>${this.eProfileJson[chat.getCookie("language")].error}</div>\
				<div class='popup-btn'>\
					<button type='button' class='btn btn-danger mb-3'>${this.eProfileJson[chat.getCookie("language")]._okay}</button>\
				</div>\
			</div>`);
			$('.popup-btn button').click(function(){
				$('#dataPopup').css('display', 'none');
				$('#dataPopup').html('');
			});
			$('.popupLine div:nth-child(1) i').css('color', '#CD3232');
			$('#dataPopup').css('display', 'flex');
		}
	}

	editProfileReload(){
		this.image = $('#imageview img');
		this.imageSrc = this.image.attr("src");
		this.tmp = $("#uploadfile").val();
		console.log("Edit Profile Reloaded!");
		$('#editPFormSubmit').click(function(e){
			e.preventDefault();
			let formData = JSON.stringify($("#editPForm").serializeArray());
			let csrf =$("#editPForm input[name='csrfmiddlewaretoken']").val();
	
			console.log(formData);
			$.ajax({
				type: 'POST',
				url: siteUrl + '/update-user',
				dataType: "json",
				data: {
					csrfmiddlewaretoken: csrf,
					formData: formData
				},
				success: function (res){
					editProfile.statusPopup(res.status);
				},
				error: function (err){
					editProfile.statusPopup('error');
				}
			})
		});
		$('#saveAvatar').click(function(e){
			e.preventDefault();
			var form = $("#fileUploadArea")[0];
			var formData = new FormData(form);
			$.ajax({
				type: 'POST',
				url: siteUrl + '/update-avatar',
				data: formData,
				contentType: false,
				processData: false,
				success: function (res){
					editProfile.statusPopup(res.status);
				},
				error: function (err){
					editProfile.statusPopup('error');
				}
			})
		});
		$("#uploadfile").change(function() {
			if ($("#uploadfile").val() == "") {
				return;
			}
			var file = $("#uploadfile")[0].files[0];
			var reader = new FileReader();
			reader.onload = function(e) {
				if (!editProfile.checkExtension(file)){
					alert(eProfileJson[chat.getCookie("language")]["alert"]);
					$("#uploadfile").val(editProfile.tmp);
					editProfile.image.attr('src', editProfile.imageSrc);
					return;
				}
				editProfile.image.attr('src', e.target.result);
			};
			reader.readAsDataURL(file);
		});
	}
}


