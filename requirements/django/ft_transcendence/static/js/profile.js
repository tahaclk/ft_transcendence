class Profile{
	constructor(){
		console.log("profile js loaded!");

		this.profileJson = {
			"en":{
				"accept" : "Accept",
				"decline" : "Decline",
				"unfriend" : "Unfriend",
				"cancelReq" : "Cancel Request",
				"friendReq" : "Friend Request",
				"msg" : "Message",
				"block" : "Block",
				"unblock" : "Unblock",
				"notification": "End of Notifications",
				"popUpError": "An error occured!",
				"popUpError2": "Request already sent!"
			},
			"tr":{
				"accept" : "Kabul et",
				"decline" : "Reddet",
				"unfriend" : "Arkadaşlıktan çıkar",
				"cancelReq" : "İsteği İptal et",
				"friendReq" : "Arkadaşlık İsteği",
				"msg" : "Mesaj",
				"block" : "Engelle",
				"unblock" : "Engeli kaldır",
				"notification": "Bildirimlerin sonu",
				"popUpError": "Bir hata ile karşılaşıldı!",
				"popUpError2": "Zaten isteğiniz gönderildi!"
			},
			"de":{
				"accept": "Akzeptieren",
				"decline": "Ablehnen",
				"unfriend": "Freundschaft beenden",
				"cancelReq": "Anfrage abbrechen",
				"friendReq": "Freundschaftsanfrage",
				"msg": "Nachricht",
				"block": "Blockieren",
				"unblock": "Blockierung aufheben",
				"notification": "Ende der Benachrichtigungen",
				"popUpError": "Ein Fehler ist aufgetreten!",
				"popUpError2": "Anfrage bereits gesendet!"
			}
		};


		function friendReq(e){
			let uid = $("input[name='person-uid']").val();
			let csrf =$("#profile_datas input[name='csrfmiddlewaretoken']").val();
			let reqMod = $(e.target).attr("data-request-mod");
			let _data = {
				csrfmiddlewaretoken: csrf,
				uid: uid,
				method: reqMod
			}
			switch (_data.method){
				case "sendRequest":{
					console.log(profile.profileJson[chat.getCookie("language")]["cancelReq"]);
					$(e.target).html(profile.profileJson[chat.getCookie("language")]["cancelReq"]);
					$(e.target).toggleClass('btn-outline-primary btn-primary');
					$(e.target).attr("data-request-mod", "cancelRequest");
					let to_uid = $(".person-profile").attr("data-person-uid");
					chat.sendMessage("sendFriendRequest", {"uid": to_uid});
					break;
				}
				case "cancelRequest":{
					$(e.target).html(profile.profileJson[chat.getCookie("language")]["friendReq"]);
					$(e.target).toggleClass('btn-primary btn-outline-primary');
					$(e.target).attr("data-request-mod", "sendRequest");
					let to_uid = $(".person-profile").attr("data-person-uid");
					chat.sendMessage("cancelRequest", {"to_uid": to_uid});
					break;
				}
				case "unfriendRequest":{
					$(e.target).html(profile.profileJson[chat.getCookie("language")]["friendReq"]);
					$(e.target).toggleClass('btn-outline-primary btn-outline-danger');
					$(e.target).attr("data-request-mod", "sendRequest");
					$("#messagebtn").remove();
					let to_uid = $(".person-profile").attr("data-person-uid");
					chat.sendMessage("unFriendRequest", {"to_uid": to_uid});
					break;
				}
				case "acceptRequest":{
					$(e.target).html(profile.profileJson[chat.getCookie("language")]["unfriend"]);
					$(e.target).toggleClass('btn-outline-danger btn-success');
					$(e.target).attr("data-request-mod", "unfriendRequest");
					$('.friend-request[data-request-mod="declineRequest"]').remove();
					$('.friend-request[data-request-mod="unfriendRequest"]').after(`<button id="messagebtn" class="btn btn-primary ms-2">${profile.profileJson[chat.getCookie("language")].msg}</button>`);
					//event listener
					$("#messagebtn").click((e) => {
						if (in_sohbet == 0)
							$("#chatBtn").click();
						if (in_sohbet == 1)
							$("#go-back").click();
						let uid = $("div[data-person-uid].person-profile").attr("data-person-uid");
						setTimeout(()=>{$(`div[data-person-uid=${uid}].chat-person`).click();},200);
					});
					//
					let to_uid = $(".person-profile").attr("data-person-uid");
					chat.sendMessage("friendShipResponse", {"to_uid": to_uid, "response": "accept"});
					break;
				}
				case "declineRequest":{
					$(e.target).html(profile.profileJson[chat.getCookie("language")]["friendReq"]);
					$(e.target).toggleClass('btn-danger btn-outline-primary');
					$(e.target).attr("data-request-mod", "sendRequest");
					$('.friend-request[data-request-mod="acceptRequest"]').remove();
					let to_uid = $(".person-profile").attr("data-person-uid");
					chat.sendMessage("friendShipResponse", {"to_uid": to_uid, "response": "reject"});
					break;
				}
				case "block":{
					$(e.target).html(profile.profileJson[chat.getCookie("language")]["unblock"]);
					$(e.target).toggleClass('btn-danger btn-outline-danger');
					$(e.target).attr("data-request-mod", "unblock");
					let to_uid = $(".person-profile").attr("data-person-uid");
					break;
				}
				case "unblock":{
					$(e.target).html(profile.profileJson[chat.getCookie("language")]["block"]);
					$(e.target).toggleClass('btn-outline-danger btn-danger');
					$(e.target).attr("data-request-mod", "block");
					let to_uid = $(".person-profile").attr("data-person-uid");
					break;
				}
			}
			$("#notificationsDropdown").html(`<div class="p-0 m-0" id="endofnotifications"><hr>\
			<li><span class='dropdown-item disabled micro-text'>${profile.profileJson[chat.getCookie("language").notification]}</span></li><div>`);
			$("#circleNotf").removeClass("bg-danger");
			chat.getFriendRequestList();
		}

		function blockReq(e) {
			let uid = $("input[name='person-uid']").val();
			let csrf =$("#profile_datas input[name='csrfmiddlewaretoken']").val();
			let reqMod = $(e.target).attr("data-request-mod");
			let _data = {
				csrfmiddlewaretoken: csrf,
				uid: uid,
				method: reqMod
			}
			$.ajax({
				method:'POST',
				url: siteUrl + '/friend/blockRequest',
				dataType: 'json',
				data: _data,

				success: function (res){
					switch (_data.method){
						case "block":{
							$(e.target).html(profile.profileJson[chat.getCookie("language")]["unblock"]);
							$(e.target).toggleClass('btn-danger btn-outline-danger');
							$(e.target).attr("data-request-mod", "unblock");
							break;
						}
						case "unblock":{
							$(e.target).html(profile.profileJson[chat.getCookie("language")]["block"]);
							$(e.target).toggleClass('btn-outline-danger btn-danger');
							$(e.target).attr("data-request-mod", "block");
							break;
						}
					}
				},
				error: function (err){
					console.log("STATUS: " + err.status);
					switch(err.status){
						case 400:
							profile.dataPopup("error", profile.profileJson[chat.getCookie("language")]["popUpError"]);
							break;
						case 402:
							profile.dataPopup("info", profile.profileJson[chat.getCookie("language")]["popUpError2"]);
							break;
					}
				}
			});
		}

		if (document.querySelector('.friend-request')){
			console.log("ATIYOM USTA");
			$(document).off('click', '.friend-request');
			$(document).on('click', '.friend-request', friendReq);
		}

		if (document.querySelector('#block-requests')){
			$("#block-requests").off('click');
			$("#block-requests").on("click", blockReq);
		}
		this.calcWinRate();
	}

	dataPopup(mod, message){
		let tmp = {"tr": "Tamam", "en": "Okay", "de": "Okay"};
		let okay = tmp[chat.getCookie("language")]
		if (mod == "success"){
			$('#dataPopup').html(`\
			<div class='popupLine'>\
			<div>\
			<i class='fa-solid fa-circle-check'></i>\
			</div>\
			</div>\
			<div class='popupContent'>\
			<div class='popupMessage'>" + message + "</div>\
			<div class='popup-btn'>\
			<button type='button' class='btn btn-success mb-3'>${okay}</button>\
			</div>\
			</div>`);
			$('.popup-btn button').click(function(){
				$('#dataPopup').css('display', 'none');
				$('#dataPopup').html('');
			});
			$('.popupLine div:nth-child(1) i').css('color', '#4caf50');
			$('#dataPopup').css('display', 'flex');
		}
		else if(mod == "error"){
			$('#dataPopup').html(`\
			<div class='popupLine'>\
				<div>\
					<i class='fa-solid fa-circle-xmark'></i>\
				</div>\
			</div>\
			<div class='popupContent'>\
				<div class='popupMessage'>" + message + "</div>\
				<div class='popup-btn'>\
					<button type='button' class='btn btn-danger mb-3'>${okay}</button>\
				</div>\
			</div>`);
			$('.popup-btn button').click(function(){
				$('#dataPopup').css('display', 'none');
				$('#dataPopup').html('');
			});
			$('.popupLine div:nth-child(1) i').css('color', '#CD3232');
			$('#dataPopup').css('display', 'flex');
		}else if (mod == "info"){
			$('#dataPopup').html(`\
				<div class='popupLine'>\
					<div>\
						<i class='fa fa-info-circle text-info' aria-hidden='true'></i>\
					</div>\
				</div>\
				<div class='popupContent'>\
					<div class='popupMessage'>` + message + `</div>\
					<div class='popup-btn'>\
						<button type='button' class='btn btn-info mb-3 text-white'>${okay}</button>\
					</div>\
				</div>`);
			$('.popup-btn button').click(function(){
				$('#dataPopup').css('display', 'none');
				$('#dataPopup').html('');
			});
			$('#dataPopup').css('display', 'flex');
		}
	}

	calcWinRate(){
		const rating = document.getElementsByClassName('rating')[0];
		const block = document.getElementsByClassName('block');

		for (var i = 1; i < 100; i++){
			rating.innerHTML += "<div class='block'></div>";
			block[i].style.transform = "rotate(" + 3.6 * i + "deg)";
			block[i].style.animationDelay = `${i/40}s`;
		}
		var realDataTarget = parseInt($("#matchWon").html()) / parseInt($("#matchPlayedCnt").html()) * 100;
		if (isNaN(realDataTarget)){
			realDataTarget = 0;
		}
		const lines = document.querySelectorAll(`.card .rating .block:nth-child(-n+${parseInt(realDataTarget) + 1})`);
		lines.forEach(line => {
			line.classList.add('bg-primary');
			line.style.boxShadow = "0 0 15px #0d6efd,0 0 30px #0d6efd";
		});
		var counterElement = document.querySelector(".counter");
		counterElement.dataset.target = realDataTarget;
		const counter = document.querySelector('.counter');
		counter.innerText = 0;
		const target = +counter.getAttribute('data-target');
		const numberCounter = () => {
			const value = +counter.innerText;
			if (value < target){
				counter.innerText = Math.ceil(value + 1);
				setTimeout(() => {
					numberCounter()
				}, 25)
			}
		}
		numberCounter();
		//var nbr = 13;
		//var wonCnt = 8;
		//var loseCnt = 5;
		//var minutesAll = 5295;
		//var scoreCnt = 374;
		//$("#matchPlayedCnt").html(nbr);
		//$("#matchWon").html(wonCnt);
		//$("#matchLost").html(loseCnt);
		//$("#minutesMatch").html(minutesAll);
		//$("#goalCnt").html(scoreCnt);
	}
}
