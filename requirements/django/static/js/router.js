'use strict';

function Router(routes) {
	try {
		if (!routes) {
			throw 'error: routes param is mandatory';
		}
		this.constructor(routes);
		this.init();
	} catch (e) {
		console.error(e);
	}
}

Router.prototype = {
	routes: undefined,
	rootElem: undefined,
	lasthtmlName: undefined,
	constructor: function (routes) {
		this.routes = routes;
		this.rootElem = document.getElementById('app');
	},
	init: function () {			//HER SEFERİNDE İNİTLEMEK YERİNE DOCUMENT ÜZERİNDEN .route-link CLİCKLERİNİ DİNLE
		var r = this.routes;
		(function(scope, r) {
			document.addEventListener('click', function(event) {
				if (event.target.closest("#notificationsbtn") && event.target.closest("#notificationsbtn").getAttribute("id") == "notificationsbtn"){
					console.log("PUT REQUEST LİST");
					$("#circleNotf").removeClass("bg-danger");
					chat.getFriendRequestList();
				}
				console.log("click");
				if (event.target.closest(".route-link") && event.target.closest(".route-link").classList.contains('route-link')) {
					console.log("route-link");
					let p = event.target.closest(".route-link").getAttribute('data-href');
					let path = window.location.pathname;
					let pathArray = path.split('/');
					let basePath = pathArray[pathArray.length - 1];
					//game sayfasında ise ve mevcutta oyun varsa adama oyunu kaybettir
					if (basePath == "game" && p != "game" && chat != undefined && chat.chatSocket != undefined && chat.chatSocket.readyState == WebSocket.OPEN)
						chat.sendMessage("areYouSearching", "False");
					try{
						if (basePath == "game" && game.gameSocket != undefined && game.gameSocket.readyState == WebSocket.OPEN)
							game.sendGameMessage("surrender", "");
					}
					catch(e){
						console.log(e);
					}
					if (basePath !== p) {
						scope.hasChanged(scope, r, p, true);
					} else {
						scope.hasChanged(scope, r, p, false);
					}
				}
				if (event.target.closest(".invite-btn") && event.target.closest(".invite-btn").classList.contains('invite-btn')){
					chat.getInvitableFriends();
				}
				if (event.target.closest(".langSwitch") && event.target.closest(".langSwitch").classList.contains('langSwitch')) {
					const lang = event.target.closest(".langSwitch").getAttribute('lang');
					document.cookie = `language=${lang}; path=/; max-age=31536000; SameSite=Lax; Secure`;
					let path = window.location.pathname;
					let pathArray = path.split('/');
					let basePath = pathArray.length > 2 ? pathArray[pathArray.length - 2] + "/" + pathArray[pathArray.length - 1] : pathArray[pathArray.length - 1];
					console.log("basePath42: " + basePath);
					let tmp = {"en": ["Language", "Chat"], "tr": ["Dil", "Sohbet"], "de": ["Sprache", "Chat"]};
					document.getElementById("languageDropdown").innerHTML = tmp[lang][0];
					if (document.getElementById("chat-title") && (["Sohbet", "Chat"].includes(document.getElementById("chat-title").innerHTML)) || document.getElementById("chat-title").innerHTML == "")
						document.getElementById("chat-title").innerHTML = tmp[lang][1];
					if (basePath == "game" && game.gameSocket && game.gameSocket.readyState == WebSocket.OPEN){
						game.gameSocket.close();
						game = undefined;
					}
					scope.hasChanged(scope, r, basePath, false);
				}
				
			});
		})(this, r);
		if (this.rootElem.innerHTML.trim() == "")
			this.hasChanged(this, r);
	},
	hasChanged: function(scope, r, dataHref="home", saveHistory){
		var path = window.location.pathname;
		var pathArray = path.split('/');
		var basePath = pathArray[pathArray.length - 1];
		if (pathArray.length > 2 )
			basePath = pathArray[pathArray.length - 2] + "/" + pathArray[pathArray.length - 1];
		if (basePath.length > 0) {
			for (var i = 0, length = r.length; i < length; i++) {
				var route = r[i];
				if(route.isActiveRoute(dataHref)) {
					scope.goToRoute(dataHref, true);
					if (saveHistory){
						var url = "https://" + window.location.host + "/" + dataHref;
						history.pushState({page: dataHref}, "", url);
					}
				}
			}
		} else {
			for (var i = 0, length = r.length; i < length; i++) {
				var route = r[i];
				if(route.default) {
					scope.goToRoute(route.htmlName);
					var url = "https://" + window.location.host + "/" + dataHref;
					history.pushState({page: dataHref}, "" , url);
				}
			}
		}
	},
	goToRoute: function (htmlName, samePage=false) {
		(function(scope) {
			var url = '/viewApi/' + htmlName;
			console.log("url: " + url);
			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function () {
				if (this.readyState === 4 && this.status === 200) {
					scope.rootElem.innerHTML = this.responseText;
					let arr = {
						"editProfile": editProfile, 
						"profile": profile, 
						"game": game, 
						"matchs": matchs
					};

					let addedCss = [];
					scope.routes.forEach(route => {
						if (htmlName.startsWith("user/") && route.htmlName == "profile")
							htmlName = "profile";
						else if (htmlName.startsWith("matchs/") && route.htmlName == "matchs")
							htmlName = "matchs";
						if (route.htmlName != htmlName){
							switch (route.htmlName){
								case "edit-profile":
									editProfile = undefined;
									break;
								case "profile":
									profile = undefined;
									break;
								case "join-tournament":
									jointournament = undefined;
									break;
								case "game":
									if (game != undefined && game.gameSocket != undefined && game.gameSocket.readyState == WebSocket.OPEN)
										game.gameSocket.close();
									game = undefined;
									break;
								case "matchs":
									matchs = undefined;
									break;
								case "tournament-history":
									tournamentHistory = undefined;
									break;
								case "user":
									profile = undefined;
									break;
							}

							route.cssFileArr.forEach(file =>{
								if ($(`link[href="/static/css/${file}.css"]`).length && addedCss.indexOf(file) < 0)
									$(`link[href="/static/css/${file}.css"]`).remove();
							});
						}
						else{
							switch (route.htmlName){
								case "edit-profile":
									editProfile = new EditProfile();
									break;
								case "profile":
									profile = new Profile();
									break;
								case "join-tournament":
									jointournament = new JoinTournament();
									break;
								case "game":
									game = new Game();
									break;
								case "tournament-history":
									tournamentHistory = new TournamentHistory();
									break;
								case route.htmlName.startsWith('matchs') ? route.htmlName : '':
									matchs = new Matchs();
									break;
								case route.htmlName.startsWith('user') ? route.htmlName : '':
									profile = new Profile();
									break;
							}
							route.cssFileArr.forEach(file =>{
								if (!$(`link[href="/static/css/${file}.css"]`).length){
									$('head').append(`<link rel="stylesheet" href="/static/css/${file}.css">`);
									addedCss.push(file);
								}
							});
							 
						}
					});
				}
				if (htmlName == "game")
					$("#main-container").removeClass("container");
				else
					$("#main-container").addClass("container");
				this.lasthtmlName = htmlName;
			}
			xhttp.open('GET', url, true);
			xhttp.send();
			console.log("goToRoute: " + url);
			$("#urlObject").attr("data-href", "/viewApi/" + htmlName);
		})(this);
	}
};

