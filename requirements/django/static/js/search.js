class Search
{
	constructor(){
		this.langText = {
			"en":{
				"accept" : "Accept",
				"decline" : "Decline",
				"unfriend" : "Unfriend",
				"cancelReq" : "Cancel Request",
				"friendReq" : "Friend Request",
				"block" : "Block",
				"msg" : "Message",
				"unblock" : "Unblock",
				"endOfNotifications" : "End of Notifications"
			},
			"tr":{
				"accept" : "Kabul et",
			    "decline" : "Reddet",
			    "unfriend" : "Arkadaşlıktan çıkar",
			    "cancelReq" : "İsteği İptal et",
			    "friendReq" : "Arkadaşlık İsteği",
			    "block" : "Engelle",
				"msg" : "Mesaj",
			    "unblock" : "Engeli kaldır",
				"endOfNotifications" : "Bildirimlerin Sonu"
			},
			"de":{
				"accept": "Akzeptieren",
				"decline": "Ablehnen",
				"unfriend": "Freundschaft beenden",
				"cancelReq": "Anfrage abbrechen",
				"friendReq": "Freundschaftsanfrage",
				"block": "Blockieren",
				"msg": "Nachricht",
				"unblock": "Blockierung aufheben",
				"endOfNotifications": "Ende der Benachrichtigungen"
			}
		};
		document.addEventListener('click', function(event) {
			$('#searchUsers').on('input', function(){
				var dropdownMenu = $("#userListDropdown");
				clearTimeout(this.delay);
				this.delay = setTimeout(function(){if (chat.chatSocket.readyState !== WebSocket.CLOSED && this.value.trim() != ""){
					chat.sendMessage("searchUsers", chat.escapeHtml(this.value));
				}}.bind(this), 800);
				if (this.value.trim() == ""){
					dropdownMenu.removeClass("d-flex");
					dropdownMenu.addClass("d-none");
					dropdownMenu.empty();
				}
			});
			if (event.target.closest("#messagebtn") && event.target.closest("#messagebtn").getAttribute("id") == "messagebtn"){
				if (chat.in_sohbet == 0)
					$("#chatBtn").click();
				if (chat.in_sohbet == 1)
					$("#go-back").click();
				let uid = $("div[data-person-uid].person-profile").attr("data-person-uid");
				setTimeout(()=>{$(`div[data-person-uid=${uid}].chat-person`).click();},200);
			};
		});
	}

	usersQueryResult(queryResult){
		var dropdownMenu = $("#userListDropdown");
		dropdownMenu.addClass('mt-5');
		var luItem = $('<lu>',);
		dropdownMenu.removeClass("d-none");
		dropdownMenu.addClass("d-flex");
		dropdownMenu.empty();
		if (!queryResult.length){
			var emptyQueryItem = $('<li>', {class: 'dropdown-item d-flex flex-row',href: '#'});
			var emptyText = $('<span>', {text: 'User Not Found', class: ''});
			emptyQueryItem.append(emptyText);
			luItem.append(emptyQueryItem);
		}
		for (var i = 0; i < queryResult.length; i++) {
			var userItem = $('<li>', {class: 'dropdown-item d-flex flex-row route-link', "data-href": "user/" + queryResult[i].username, style: "cursor: pointer"});
			var thumbnail = $('<img>', {src: queryResult[i].thumbnail, alt: 'Thumbnail', class: 'img-chat rounded-circle my-auto me-3'});
			var displayName = $('<span>', {text: queryResult[i].displayname, class: 'my-auto'});
			userItem.append(thumbnail);
			userItem.append(displayName);
			luItem.append(userItem);
		}
		dropdownMenu.append(luItem);
	}

	friendShipNotification(friendShipRequest, playSound = false){
		if ($(`#notificationsDropdown li.notification-item[data-fr-uid=${friendShipRequest.from_uid}]`).length > 0)
			return;
		var yeniLi = $("<li>").addClass("d-flex flex-column gap-1 bg-light p-1 pe-auto notification-item");
		yeniLi.attr("data-fr-uid", `${friendShipRequest.from_uid}`);


		var innerDiv1 = $("<div>").addClass("d-flex gap-1 justify-content-evenly align-items-center micro-text lh-base");
		var innerDiv2 = $("<div>").addClass("d-flex gap-1 justify-content-evenly");


		var resim = $("<img>").addClass("rounded-circle img-chat ms-2").attr("src", `${friendShipRequest.thumbnail}`).attr("alt", "profil_resmi");
		var isimSpan = $("<span>").text(`${friendShipRequest.displayname}`);


		var kabulButon = $("<button>").addClass("btn btn-success p-1").attr("type", "button").text(this.langText[chat.getCookie("language")]["accept"]);
		var reddetButon = $("<button>").addClass("btn btn-danger p-1").attr("type", "button").text(this.langText[chat.getCookie("language")]["decline"]);

		innerDiv1.append(resim, isimSpan);
		innerDiv2.append(kabulButon, reddetButon);

		yeniLi.append(innerDiv1, innerDiv2);

		//Buton event listenerları
		kabulButon.on("click", ()=>{
			let newfrq_uid = $(kabulButon).closest("li").attr("data-fr-uid");
			var path = window.location.pathname;
			var response = "accept";
			$(kabulButon).closest("li").remove();
			if (path == "/user/"+friendShipRequest.from_username){
				$("button[data-request-mod=acceptRequest]").remove();
				$("button[data-request-mod=declineRequest]").remove();
				$("#worriedP").after(`<button data-request-mod="unfriendRequest" class="btn btn-outline-danger friend-request">${this.langText[chat.getCookie("language")]["unfriend"]}<</button>`);
			}
			chat.sendMessage("friendShipResponse", {"to_uid": newfrq_uid, "response": response});
		});

		reddetButon.on("click", ()=>{
			let newfrq_uid = $(reddetButon).closest("li").attr("data-fr-uid");
			var path = window.location.pathname;
			var response = "reject";
			$(reddetButon).closest("li").remove();
			if (path == "/user/"+friendShipRequest.from_username){
				$("button[data-request-mod=acceptRequest]").remove();
				$("button[data-request-mod=declineRequest]").remove();
				$("#worriedP").after(`<button data-request-mod="sendRequest" class="btn btn-outline-primary friend-request">${this.langText[chat.getCookie("language")]["friendReq"]}</button>`);
			}
			chat.sendMessage("friendShipResponse", {"to_uid": newfrq_uid, "response": response});
		});
		console.log("heeeeeey");
		console.log(friendShipRequest);
		console.log($("#notificationsDropdown li:last-child"));
		console.log(yeniLi);
		yeniLi.insertBefore($("#endofnotifications"));
		if (playSound){
			chat.playNotification();
			$("#circleNotf").addClass("bg-danger");
		}
	}

	putRequestList(frq){
		let gameRequestList = frq.games;
		let tournamentRequestList = frq.tournaments;
		console.log("turnuva istekleri \n");
		console.log(tournamentRequestList);
		let friendRequestList = frq.users;
		console.log("Frienddd istek: \n");
		console.log(friendRequestList);

		let text =  this.langText[chat.getCookie("language")]["endOfNotifications"];
		console.log("NOLUYO LAN text: ", text);
		$("#notificationsDropdown").html(`<div class="p-0 m-0" id="endofnotifications"><hr>\
		<li><span class='dropdown-item disabled micro-text'>${text}</span></li><div>`);
		friendRequestList.forEach(friendShipRequest => {
			if ($(`#notificationsDropdown li.notification-item[data-fr-uid=${friendShipRequest.from_uid}]`).length == 0){
				console.log("GİRDİM AMK NOLDU HEEEE");
				console.log(friendShipRequest.from_uid.toString());
				this.friendShipNotification(friendShipRequest);
			}
		});
		tournamentRequestList.forEach(tournamentRequest => {
			if ($(`#notificationsDropdown li.notification-item[data-tr-uid=${tournamentRequest.tournamentId}]`).length == 0){
				console.log("GİRDİM AMK NOLDU HEEEE2");
				console.log(tournamentRequest.inviter_uid.toString());
				chat.addInviteNotification(tournamentRequest);
			}
		});
		gameRequestList.forEach(gameRequest => {
			if ($(`#notificationsDropdown li.notification-item[data-gfr-uid=${gameRequest.from_uid}]`).length == 0){
				chat.addGameInviteNotification(gameRequest);
			}
		});
	}

}
