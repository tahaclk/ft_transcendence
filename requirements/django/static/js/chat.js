class Chat{
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
				"invite": "Invite",
				"classic": "Classic",
				"powerups": "Powerups",
				"boosted": "Boosted",
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
				"invite": "Davet Et",
				"classic": "Klasik",
				"powerups": "Güçlendirmeli",
				"boosted": "Hızlanmalı"
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
				"invite": "Einladen",
				"classic": "Klassisch",
				"powerups": "Power-Ups",
				"boosted": "Verbessert",
			}
		};

		this.chatBox = $(".chat-box");
		this.in_sohbet = 0;
		this.localSiteUrl = this.replaceSiteUrl(siteUrl);
		this.interval = undefined;
		this.matchStatus = undefined;
		this.chatSocket = new WebSocket('wss://' + this.localSiteUrl + ':3000/ws/chat/');

		this.chatSocket.onopen = (event) => {
			//console.log('WebSocket connection opened:', event);
			this.chatSocket.send(JSON.stringify({ "token": this.getCookie("token"), "mode": "user-register", "message": "" }));
			this.getFriendsRequest();
		};

		this.chatSocket.onmessage = (event) => {
			const message = JSON.parse(event.data);
			if (message.friends)
				this.putFriends(message);
			else if (message.message_history)
				this.putMessageHistory(message)
			else if (message.sended_message)
				this.putMessage(message.sended_message, message.warning)
			else if (message.onlineStatus)
				this.changeOnlineStatus(message)
			else if (message.friendShipRequest)
				search.friendShipNotification(message.friendShipRequest, true)
			else if (message.usersQueryResult)
				search.usersQueryResult(message.usersQueryResult);
			else if (message.friendRequestList)
				search.putRequestList(message.friendRequestList);
			else if (message.friendShipView)
				this.friendShipView(message.friendShipView);
			else if (message.getMatch)
				this.getMatch(message.getMatch);
			else if (message.joinQuickMatch)
				this.joinQuickMatch(message.joinQuickMatch);
			else if (message.isInMatch)
				this.isInMatch(message.isInMatch);
			else if (message.areYouSearching)
				this.areYouSearching(message.areYouSearching);
			else if (message.invitableFriends)
				this.invitableFriends(message.invitableFriends);
			else if (message.youAreInvited)
				this.addInviteNotification(message.youAreInvited, true);
			else if (message.reloadTournamentPage){
				if (jointournament)
					jointournament.sendMessage("getActiveTournaments","");
			}
			else if (message.nextMatch){
				console.log("nextMATCH GİRİYOM LA")
				this.createPopUp(message.nextMatch);
			}
			else if (message.matchInvite){
				this.addGameInviteNotification(message.matchInvite)
			}
			//console.log('Received message:', message);
		};

		this.chatSocket.onclose = (event) => {
			//console.log('WebSocket connection closed:', event);
		};

		$(document).ready(function() {
			//Chat box açılıp kapanma olayları
			$("#chatBtn").click((e)=>{
				chat.chatBox.toggleClass('opened');
				if ($("#chatBtn i").hasClass("fa-chevron-down")){
					$("#chatBtn i").removeClass("fa-chevron-down");
					$("#chatBtn i").addClass("fa-chevron-up");
				}
				else{
					$("#chatBtn i").removeClass("fa-chevron-up");
					$("#chatBtn i").addClass("fa-chevron-down");
				}
				$("#go-back").toggleClass("btn-outline-primary btn-primary");
				$("#oceanIsReaded").remove();
				if (chat.in_sohbet == 0)
					chat.getFriendsRequest();
			});

			$("#go-back").click((e) => {
				$("#chat-body").toggleClass("gap-3 overflow-scroll chat-profiles bg-dark");

				$("#chat-profile").attr("data-person-uid", "");
				$("#chat-profile").toggleClass("in_sohbet");

				if ($("#chat-profile .inner-chat").hasClass("online")){
					$("#chat-profile .inner-chat").toggleClass("online");
					$("#chat-profile .inner-chat").toggleClass("d-none");
				}
				else if ($("#chat-profile .inner-chat").hasClass("offline")){
					$("#chat-profile .inner-chat").toggleClass("offline");
					$("#chat-profile .inner-chat").toggleClass("d-none");
				}


				$("#chat-title-img").attr("src", "");
				$("#chat-title-img").toggleClass("d-none d-block");

				$("#chat-title").text(["Chat", "Sohbet", "Chat"][["en", "tr", "de"].indexOf(chat.getCookie("language"))]);
				$("#chat-title").toggleClass("extra-small-text");

				$("#chat-title-area").toggleClass("align-items-start gap-2");
				$("#chat-title-area").toggleClass("d-flex");

				$("#go-back").toggleClass("d-block d-none");
				$("#chat-bar").toggleClass("w-50 w-100");
				$("#chatBtn").toggleClass("normal anormal");
				chat.getFriendsRequest();
				chat.in_sohbet = 0;
			});
		});
	}

	addGameInviteNotification(gameInvite, playSound = false){
		if ($(`#notificationsDropdown li.notification-item[data-gfr-uid=${gameInvite.from_uid}]`).length > 0)
			return;
		var yeniLi = $("<li>").addClass("d-flex flex-column gap-1 bg-light p-1 pe-auto notification-item");
		yeniLi.attr("data-gfr-uid", `${gameInvite.from_uid}`);

		var innerDiv1 = $("<div>").addClass("d-flex gap-1 justify-content-evenly align-items-center micro-text lh-base");
		var innerDiv2 = $("<div>").addClass("d-flex gap-1 justify-content-evenly");

		var resim = $("<img>").addClass("rounded-circle img-chat ms-2").attr("src", `${gameInvite.from_thumbnail}`).attr("alt", "profil_resmi");
		var isimSpan = $("<span>").text(`${gameInvite.from_displayname}`);

		var kabulButon = $("<button>").addClass("btn btn-success p-1").attr("type", "button").text(this.langText[chat.getCookie("language")]["accept"]);
		var reddetButon = $("<button>").addClass("btn btn-danger p-1").attr("type", "button").text(this.langText[chat.getCookie("language")]["decline"]);

		innerDiv1.append(resim, isimSpan);
		innerDiv2.append(kabulButon, reddetButon);

		yeniLi.append(innerDiv1, innerDiv2);

		//Buton event listenerları
		kabulButon.on("click", ()=>{
			console.log("TURNUva isteğini kabul ediyom");
			$(kabulButon).closest("li").remove();
			chat.sendMessage("gameAccept", {"from_uid": $(kabulButon).closest(`li.notification-item[data-gfr-uid]`).attr("data-gfr-uid")});
		});

		reddetButon.on("click", ()=>{
			console.log("TURNUva isteğini reddediyom");
			$(reddetButon).closest("li").remove();
			chat.sendMessage("gameReject", {"from_uid": $(reddetButon).closest(`li.notification-item[data-gfr-uid]`).attr("data-gfr-uid")});
		});
		console.log("heeeeeey");
		console.log(gameInvite);
		console.log($("#notificationsDropdown li:last-child"));
		console.log(yeniLi);
		yeniLi.insertBefore($("#endofnotifications"));
		if (playSound){
			chat.playNotification();
			$("#circleNotf").addClass("bg-danger");
		}
	}

	semiMatchsFinished(tid){
		this.sendMessage("getTournamentMatchsEveryone", {"tournamentId": tid});
	}

	getMatchPopup(tid){
		console.log("*******************************");
		console.log(tid);
		this.sendMessage("getTournamentMatchs", {"tournamentId": tid});
	}

	createPopUp(nextMatch){
		console.log("NEXTMATCH DATA");
		console.log(nextMatch);
		let element = `
		<div class='d-flex flex-column fixed-right-menu bg-primary p-2 align-items-center'>
			<div class='d-flex gap-2 flex-nowrap'>
				<!--Person1-->
				<div class='d-flex flex-column gap-2 align-items-center'>
					<div>
						<img src='${nextMatch.p1_thumbnail}' class='rounded-circle img-chat'></img>
					</div>
					<div>
						<h5>${nextMatch.p1_username[0].toUpperCase() + nextMatch.p1_username.slice(1)}</h5>
					</div>
				</div>
				<!--Person2-->
				<div class='d-flex flex-column gap-2 align-items-center'>
					<div>
						<img src='${nextMatch.p2_thumbnail}' class='rounded-circle img-chat'></img>
					</div>
					<div>
						<h5>${nextMatch.p2_username[0].toUpperCase() + nextMatch.p2_username.slice(1)}</h5>
					</div>
				</div>
			</div>
			<div>
				<button id='popUpRouter' data-href='game'  class='btn btn-warning text-decoration-none route-link'>Go To Match!</button>
			</div>
		</div>
		`;
		$("#app").append(element);
		$("#popUpRouter").off("click").on("click", (e) => {
			if (game){
				game = undefined;
				game = Game();
			}
			if ($(".fixed-right-menu").length > 0)
				$(".fixed-right-menu")[0].remove();
		});
		setTimeout(()=>{
			if ($(".fixed-right-menu").length > 0)
				$(".fixed-right-menu")[0].remove();
		}, 10000);
	}

	invitableFriends(invitableFriends){
		let inviteList = $("#inviteList");
		console.log(inviteList);
		if (invitableFriends && inviteList){
			console.log(invitableFriends);
			inviteList.html("");

			/* <div class="d-flex align-items-center gap-2">
    	        <div class="d-flex align-items-center">
    	            <img class="rounded-circle img-chat" src="#"></img>
    	            <h5>Ramazan Yusuf Türker</h5>
    	        </div>
    	        <div>
    	            <button class="btn btn-success">Davet Et</button>
    	        </div>
    	    </div> */

			invitableFriends.forEach((element) => {
				inviteList.append(`
				<div class="d-flex w-100 gap-2 justify-content-between" data-user-uid="${element.uid}">
					<div class="d-flex align-items-center">
						<img class="rounded-circle img-chat me-2" src="${element.thumbnail}"></img>
						<h5 class="mb-0">${element.displayname}</h5>
					</div>
					<div>
						<button class="btn btn-success ${(element.invitable == true) ? "" : "disabled"} invite-user">${this.langText[chat.getCookie("language")].invite}</button>
					</div>
				</div>
				`);
			});
			$(".invite-user").click((e) => {
				let uid = $(e.target).closest("div[data-user-uid]").attr("data-user-uid");
				let tournamentId = $("#exampleModalCenter").attr("data-tournament-id2");
				if (uid && tournamentId && tournamentId != "-1")
					this.sendMessage("inviteTournamentUser", {"uid": uid, "tournamentId": tournamentId});
				$(e.target).addClass("disabled");
			});
		}
	}

	getInvitableFriends(){
		this.sendMessage("getInvitableFriends", "");
	}

	addInviteNotification(youAreInvited, playSound = false){
		/*
		'youAreInvited': {
			"tournamentId": tournament.id,
			"tournamentName": tournament.name,
			"inviter_uid": user.uid,
			"inviter_displayname": user.displayname,
			"inviter_thumbnail": user.thumbnail.url,
			"invited_uid": to_user.uid,
			"invited_displayname": to_user.displayname
		}
		*/
		if ($(`#notificationsDropdown li.notification-item[data-tr-uid=${youAreInvited.inviter_uid}]`).length > 0)
			return;
		var yeniLi = $("<li>").addClass("d-flex flex-column gap-1 bg-light p-1 pe-auto notification-item");
		yeniLi.attr("data-tr-uid", `${youAreInvited.inviter_uid}`);


		var innerDiv1 = $("<div>").addClass("d-flex gap-1 justify-content-evenly align-items-center micro-text lh-base");
		var innerDiv2 = $("<div>").addClass("d-flex gap-1 justify-content-evenly");


		var resim = $("<img>").addClass("rounded-circle img-chat ms-2").attr("src", `${youAreInvited.inviter_thumbnail}`).attr("alt", "profil_resmi");
		var isimSpan = $("<span>").text(`${youAreInvited.inviter_displayname}`);
		var tournamentName = $("<span>").text(`${youAreInvited.tournamentName}`);


		var kabulButon = $("<button>").addClass("btn btn-success p-1").attr("type", "button").text(this.langText[chat.getCookie("language")]["accept"]);
		var reddetButon = $("<button>").addClass("btn btn-danger p-1").attr("type", "button").text(this.langText[chat.getCookie("language")]["decline"]);

		innerDiv1.append(resim, isimSpan, tournamentName);
		innerDiv2.append(kabulButon, reddetButon);

		yeniLi.append(innerDiv1, innerDiv2);

		//Buton event listenerları
		kabulButon.on("click", ()=>{
			console.log("TURNUva isteğini kabul ediyom");
			$(kabulButon).closest("li").remove();
			chat.sendMessage("tournamentAccept", {"tournamentId": youAreInvited.tournamentId});
		});

		reddetButon.on("click", ()=>{
			console.log("TURNUva isteğini reddediyom");
			$(reddetButon).closest("li").remove();
			chat.sendMessage("tournamentReject", {"tournamentId": youAreInvited.tournamentId});
		});
		console.log("heeeeeey");
		console.log(youAreInvited);
		console.log($("#notificationsDropdown li:last-child"));
		console.log(yeniLi);
		yeniLi.insertBefore($("#endofnotifications"));
		if (playSound){
			chat.playNotification();
			$("#circleNotf").addClass("bg-danger");
		}
	}

	areYouSearching(){
		let path = window.location.pathname;
		let pathArray = path.split('/');
		let basePath = pathArray[pathArray.length - 1];
		if (basePath == "game" && this.matchStatus != undefined){
			this.sendMessage("areYouSearching", "True");
		}else{
			this.sendMessage("areYouSearching", "False");
		}
	}

	replaceSiteUrl(siteUrl) {
		siteUrl = siteUrl.replace(/^https?:\/\//, '');
		//siteUrl = siteUrl.replace(/:8000$/, ':3000');
		return siteUrl;
	}

	getFriendsRequest(){
		this.sendMessage("get-friends", "");
	}

	getFriendRequestList(){
		this.sendMessage("getFriendRequestList", "");
	}

	getMessageHistory(to_uid){
		this.chatSocket.send(JSON.stringify({ "token": this.getCookie("token"), "mode": "get-message-history", "message": {"to": to_uid.toString()}}));
	}

	putFriends(message){
		$('.chat-profiles').html("");

		//console.log(message);
		var isReaded = false;
		message.friends.forEach(element => {
			var lastMessage = element.lastMessage.length > 30 ? element.lastMessage.substring(0, 30) + '...' : element.lastMessage;
			let content = $('<div>').attr('data-person-uid', element.uid).addClass('d-flex p-2 bg-primary align-items-start chat-person');
			content.append($('<img>').addClass('img-chat img-fluid img-thumbnail rounded-circle').attr('src', element.thumbnail).attr('alt', ''));
			content.append($('<div>').addClass('online-stat-circle ' + element.onlineStatus));
			let innerDiv = $('<div>').addClass('d-flex flex-column align-items-baseline');
			innerDiv.append($('<span>').addClass('h6 text-white mx-3').text(element.displayname));
			innerDiv.append($('<span>').addClass('last-message small text-warning').text(lastMessage));
			let readedDiv = $('<div>').addClass('d-flex align-items-center justify-content-center');

			if (element.isReaded == "False" ){
				let m_icon = $('<i>').addClass('fa-solid fa-envelope text-warning');
				readedDiv.append(m_icon);
				isReaded = true;
			}
			content.append(innerDiv);
			content.append(readedDiv);
			$('.chat-profiles').append(content);
		});

		if (isReaded && $("#oceanIsReaded").length == 0){
			let ocean_div = $('<div id="oceanIsReaded">').addClass("d-flex align-items-center justify-content-end w-50");
			let ocean_i = $("<i>").addClass("fa-regular fa-circle text-info fs-5 ocean_shadow");
			ocean_div.append(ocean_i);
			$("#chat-bar").after(ocean_div);
		}


		$('.chat-person').click((e)=>{
			let idx = $('.chat-person').index(e.target.closest('.chat-person'));
			//console.log("Basılan kişi index: " + idx.toString());
			let uid = $('.chat-person:eq(' + idx + ')').attr('data-person-uid');
			//console.log(uid.toString());
			this.getMessageHistory(uid);
			$("#chat-title-img").toggleClass("d-none d-block");
			$("#chat-title-area").toggleClass("d-flex");
			$("#go-back").toggleClass("d-block d-none");
			$("#chat-bar").toggleClass("w-50 w-100");
			$("#chatBtn").toggleClass("normal anormal");
			$("#oceanIsReaded").remove();
			this.in_sohbet = 1;
		})
	}

	putMessageHistory(message)
	{
		this.sendMessage("readMessage", {"to_uid": message.message_history.to_uid});
		//console.log(message);
		$("#chat-body").toggleClass("gap-3 overflow-scroll chat-profiles bg-dark");
		$("#chat-body").empty().append(
			$("<div>").attr("id", "chat-area").addClass("chat-container d-flex flex-column gap-3 text-white"),
			$("<div>").addClass("d-flex align-items-center").append(
				$("<div>").addClass("input-group p-2").append(
					$("<input>").attr({ "id": "msg-content", "class": "form-control shadow-none", "placeholder": "Type a message", "type": "text", "autocomplete": "off" }),
					$("<button>").attr({ "id": "btn-send", "class": "btn btn-outline-secondary", "type": "button" }).append($("<i>").addClass("fa-regular fa-paper-plane"))
				),
				$("<div id='invite-container'>").addClass("py-2 btn-group dropup").append(
					$("<button dropdown-toggle>").attr({ "id": "btn-invite-send", "class": "btn btn-outline-secondary", "type": "button", "data-bs-toggle":"dropdown"}).append($("<i>").addClass("fa-solid fa-gamepad")),
					$("<ul>").addClass("dropdown-menu").append(
						$("<li>").attr("data-gameInviteMode", "classic").append($("<a>").addClass("dropdown-item").text(chat.langText[chat.getCookie("language")].classic)),
						$("<li>").attr("data-gameInviteMode", "powerups").append($("<a>").addClass("dropdown-item").text(chat.langText[chat.getCookie("language")].powerups)),
						$("<li>").attr("data-gameInviteMode", "boosted").append($("<a>").addClass("dropdown-item").text(chat.langText[chat.getCookie("language")].boosted))
					)
				)
			)
		);

		//console.log(message.message_history.messages);

		message.message_history.messages.forEach(elem => {
			var sideClass = (elem.side == "left") ? "chat-left" : "chat-right";
			var alignClass = (elem.side == "right") ? "align-self-end" : "";
			var bgColorClass = (elem.side == "left") ? "bg-primary" : "bg-secondary";

			var mtimestamp = new Date(elem.timestamp);
			var localOffsetHours = (new Date().getTimezoneOffset() / 60) * -1;
			mtimestamp.setHours(mtimestamp.getHours() + localOffsetHours);
			var hour = mtimestamp.getHours();
			var minute = mtimestamp.getMinutes();
			//console.log(mtimestamp);
			var lastTimestampString = hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');

			var htmlContent = $("<div>").addClass(`d-flex flex-nowrap gap-2 ${sideClass} ${alignClass}`).append(
				$("<div>").append(
					$("<div>").addClass(`${bgColorClass} chat-item d-flex flex-column px-2 py-1`).append(
						$("<div>").text(elem.content),
						$("<div>").addClass("chat-date-text").text(lastTimestampString)
					)
				)
			);

			$("#chat-area").append(htmlContent);
		});
		$("#chat-profile").attr("data-person-uid", message.message_history.to_uid);
		$("#chat-profile").attr("data-href", `user/${message.message_history.to_username}`);
		$("#chat-profile").toggleClass("in_sohbet");
		$("#chat-profile .inner-chat").toggleClass("d-none");
		if (message.message_history.to_onlineStatus == "online"){
			$("#chat-profile .inner-chat").toggleClass("online");
		}
		else if (message.message_history.to_onlineStatus == "offline"){
			$("#chat-profile .inner-chat").toggleClass("offline");
		}
		$("#chat-title-img").attr("src", message.message_history.to_thumbnail);
		$("#chat-title").text(message.message_history.to_displayname);
		$(".chat-container").scrollTop($(".chat-container")[0].scrollHeight);
		$("#chat-title").toggleClass("extra-small-text");
		$("#chat-title-area").toggleClass("align-items-start gap-2");

		$("#btn-send").click((e)=>{
			let to_uid = $("#chat-profile").attr("data-person-uid");
			let content = $("#msg-content").val();
			if (content.trim() != ""){
				chat.sendMessage("send-message", {"to": to_uid, "content": content});
				$("#msg-content").val("");
			}
		});

		$("#invite-container a").click((e)=>{
			let to_uid = $("#chat-profile").attr("data-person-uid");
			let gamemode = "classic";
			if (e.target.closest("li").getAttribute("data-gameInviteMode") != undefined)
				gamemode = e.target.closest("li").getAttribute("data-gameInviteMode");
			this.sendMessage("match-invite", {"to": to_uid, "gamemode": gamemode});
		});

		$("#msg-content").keypress(function(event){
			var keycode = (event.keyCode ? event.keyCode : event.which);
			let content = $("#msg-content").val();
			if(keycode == '13' && chat.in_sohbet == 1 && content.trim() != ""){
				let to_uid = $("#chat-profile").attr("data-person-uid");
				chat.sendMessage("send-message", {"to": to_uid, "content": content});
				$("#msg-content").val("");
			}
		});
	}

	escapeHtml(text) {
		var map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		};
		return text.replace(/[&<>"']/g, function(m) { return map[m]; });
	}

	playNotification(){
		var audio = document.getElementById("notificationSound");
		audio.volume = 0.1;
		audio.play();
	}

	putMessage(sended_message, warning){
		if (warning != ""){
			alert(warning);
			return;
		}

		if (this.in_sohbet == 0){
			this.playNotification();
			this.getFriendsRequest();
			return;
		}

		let from, to, content, timestamp;

		from = sended_message.from;
		to = sended_message.to;
		content = sended_message.content;
		timestamp = sended_message.timestamp;

		var mtimestamp = new Date(timestamp);

		// Yerel saat dilimine göre saat ekleme
		var localOffsetHours = (new Date().getTimezoneOffset() / 60) * -1; // Saat cinsinden yerel zaman dilimi ofseti
		mtimestamp.setHours(mtimestamp.getHours() + localOffsetHours);
		var hour = mtimestamp.getHours();
		var minute = mtimestamp.getMinutes();
		var lastTimestampString = hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');

		var activePersonUid = $("#chat-profile").attr("data-person-uid");

		if ((activePersonUid == from || activePersonUid == to) && this.in_sohbet == 1) {
			var sideClass = (activePersonUid == from) ? "chat-left" : "chat-right";
			var alignClass = (activePersonUid == to) ? "align-self-end" : "";
			var bgColorClass = (activePersonUid == from) ? "bg-primary" : "bg-secondary";



			var htmlContent = `
				<div class="d-flex flex-nowrap gap-2 ${sideClass} ${alignClass}">
					<div>
						<div class="${bgColorClass} chat-item d-flex flex-column px-2 py-1">
							<div>${this.escapeHtml(content)}</div>
							<div class="chat-date-text">${lastTimestampString}</div>
						</div>
					</div>
				</div>
			`;

			$("#chat-area").append(htmlContent);
			$(".chat-container").scrollTop($(".chat-container")[0].scrollHeight);
			if (activePersonUid == from)
				this.sendMessage("readMessage", {"to_uid": activePersonUid});
		} else if (this.in_sohbet == 0) {
			var lastMessage = content.length > 30 ? content.substring(0, 30) + '...' : content;
			if ($(`div[data-person-uid=${from}] .last-message`).length)
				$(`div[data-person-uid=${from}] .last-message`).text(this.escapeHtml(lastMessage));
			else if($(`div[data-person-uid=${to}] .last-message`).length)
				$(`div[data-person-uid=${to}] .last-message`).text(this.escapeHtml(lastMessage));
		}
	}

	changeOnlineStatus(onlineStatus)
	{
		let user_uid = onlineStatus.user_uid
		let _status = onlineStatus.onlineStatus

		//console.log(onlineStatus);
		if (this.in_sohbet == 0){
			if(!$(`div[data-person-uid="${user_uid}"].chat-person .online-stat-circle`).hasClass(`${_status}`)){
				$(`div[data-person-uid="${user_uid}"].chat-person .online-stat-circle`).toggleClass("online offline");
			}
		}else{
			if(!$(`div[data-person-uid="${user_uid}"].in_sohbet .online-stat-circle`).hasClass(`${_status}`)){
				$(`div[data-person-uid="${user_uid}"].in_sohbet .online-stat-circle`).toggleClass("online offline");
			}
		}
	}

	friendShipView(friendShipView){
		let path = window.location.pathname;
		//console.log("path:" + path);
		switch(friendShipView.type){
			case "youAreBlocked":
				if (path == `/user/${friendShipView.to_username}`){
					$("#worriedP").after(`<button data-request-mod="sendRequest" class="btn btn-outline-primary friend-request">${this.langText[chat.getCookie("language")]["friendReq"]}</button>`);
					$("button[data-request-mod=cancelRequest]").remove();
				}
				break;
			case "friendrequest":
				if (path == `/user/${friendShipView.from_username}`){
					$("#worriedP").after(`<button data-request-mod="acceptRequest" class="btn btn-success friend-request">${this.langText[chat.getCookie("language")]["accept"]}</button>\
					<button data-request-mod="declineRequest" class="btn btn-danger friend-request">${this.langText[chat.getCookie("language")]["decline"]}</button>`);
					$("button[data-request-mod=sendRequest]").remove();
				}
				break;
			case "friendresponse":
				switch(friendShipView.status){
					case "accept":
						$("button[data-request-mod=cancelRequest]").remove();
						$("#worriedP").after(`<button data-request-mod="unfriendRequest" class="btn btn-outline-danger friend-request">${this.langText[chat.getCookie("language")]["unfriend"]}</button>\
						<button id="messagebtn" class="btn btn-primary">${this.langText[chat.getCookie("language")]["msg"]}</button>`);
						$("#messagebtn").click((e) => {
							if ($("#chatBtn i").hasClass("fa-chevron-up"))
								$("#chatBtn").click();
							if (this.in_sohbet == 1)
								$("#go-back").click();
							let uid = $("div[data-person-uid].person-profile").attr("data-person-uid");
							setTimeout(()=>{$(`div[data-person-uid=${uid}].chat-person`).click();},400);
						});
						break;
					case "reject":
						$("button[data-request-mod=cancelRequest]").remove();
						$("#worriedP").after(`<button data-request-mod="sendRequest" class="btn btn-outline-primary friend-request">${this.langText[chat.getCookie("language")]["friendReq"]}</button>`);
						break;
				}
				break;
			case "unfriend":
				$("button[data-request-mod=unfriendRequest]").remove();
				$("#messagebtn").remove();
				$("#worriedP").after(`<button data-request-mod="sendRequest" class="btn btn-outline-primary friend-request">${this.langText[chat.getCookie("language")]["friendReq"]}</button>`);
				break;
			case "cancel":
				$("button[data-request-mod=acceptRequest]").remove();
				$("button[data-request-mod=declineRequest]").remove();
				$("#worriedP").after(`<button data-request-mod="sendRequest" class="btn btn-outline-primary friend-request">${this.langText[chat.getCookie("language")]["friendReq"]}</button>`);
				break;
			default:
				break;
		}
		this.getFriendRequestList();
	}

	getMatch(gameSocketData){
		if (gameSocketData.game_uuid == ""){
			this.sendMessage("joinQuickMatch", gameSocketData.game_mode);
		}else{
			this.matchStatus = gameSocketData;
			if (gameSocketData.game_status == "1")
				this.sendMessage("joinQuickMatch", gameSocketData.game_mode);
		}
	}

	joinQuickMatch(data)
	{
		this.matchStatus = data;
		if (data.game_status == "1"){
			if ($("#chooseModes").hasClass("d-flex"))
				$("#chooseModes").toggleClass("d-none d-flex");
			$("#loading").toggleClass("d-none d-block");
			if (this.interval)
				clearInterval(this.interval);
			this.interval = setInterval(() => {
				let fixed_text = $("#loading").text();
				let matched = fixed_text.match(/\./g);
				if (matched != null && matched.length >= 3)
					$("#loading").text(fixed_text.substring(0, fixed_text.length - 3));
				else
					$("#loading").text(fixed_text + ".");
			}, 1000);
		}
		else if (data.game_status == "3"){
			if ($("#loading").hasClass("d-block"))
				$("#loading").toggleClass("d-none d-block");
			if ($("#chooseModes").hasClass("d-flex"))
				$("#chooseModes").toggleClass("d-none d-flex");
			clearInterval(this.interval);
			game.createFrontend(this.matchStatus);
		}
	}

	isInMatch(data){
		if (data.game_uuid){
			this.matchStatus = data;
			if ($("#chooseModes").hasClass("d-flex"))
				$("#chooseModes").toggleClass("d-none d-flex");
			clearInterval(this.interval);
			game.createFrontend(this.matchStatus);
		}else{
			$("#searchGame").click((e) => {
				let gametype = chat.escapeHtml($("#modes option:selected").val());
				//console.log("gametype: " + gametype);
				if (gametype.length > 0)
					chat.sendMessage("getMatch", gametype);
			});
		}
	}

	sendMessage(mode, message){
		this.chatSocket.send(JSON.stringify({ "token": this.getCookie("token"), "mode": mode, "message": message }));
	}

	getCookie(cname) {
		let name = cname + "=";
		let decodedCookie = decodeURIComponent(document.cookie);
		let ca = decodedCookie.split(';');
		for(let i = 0; i <ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) == ' ')
				c = c.substring(1);
			if (c.indexOf(name) == 0)
				return c.substring(name.length, c.length);
		}
		return "";
	}
}
