'use strict';
/*                     Global Files                      */
/* jQuery.js app.js route.js router.js chat.js search.js */
/* chat.css style.css                                    */
(function () {
	function init() {
		var router = new Router([
			new Route('home', 'home', true, [], []),
			new Route('about', 'about', false, [], []),
			new Route('profile', 'profile', false, ["profile"], ["winrate", "dataPopup"]),
			new Route('edit-profile', 'edit-profile', false, ["editProfile"], ["editProfile", "dataPopup"]),
			new Route('user/', 'profile', false, ["profile"], ["winrate", "dataPopup"]),
			new Route('game', 'game', false, ["game"], []),
			new Route('matchs/', 'matchs', false, ["matchs"], ["matchs"]),
			new Route('join-tournament', 'join-tournament', false, ["joinTournament"], ["joinTournament"]),
			new Route('tournament-history', 'tournament-history', false, ["tournamentHistory"], ["tournamentHistory"]),
			new Route('local-game', 'local-game', false, ["localGame"], [])
		]);
		function updateContent(page){
			console.log("updateContent:" + page);
			router.goToRoute(page);
		}
		/*var mutationObserver = new MutationObserver(function (mutations) {
			if ($("#chat").children().length > 0){
				console.log("MUTATION ABSORBER setted game socket");
				// if (gameSocket && gameSocket.readyState == WebSocket.OPEN){
				//	gameSocket.close();
				//	gameSocket = undefined;
				//} 
				setGameSocket();
			}
		});
		var urlObject = document.querySelector("#urlObject");
		mutationObserver.observe(urlObject, {attributes: true});*/
		window.onpopstate = function(event) {
			if (event.state) {
				console.log("onpopState: /viewApi/" + event.state.page);
				// Geçmişteki sayfa durumuna göre sayfa içeriğini güncelle
				updateContent(event.state.page);
			}
		};
		window.onload = function() {
			document.querySelector("#urlObject").setAttribute("data-href", "/viewApi"+window.location.pathname);
		}
	}
	init();
}());

/*Required */
let chat = undefined;
let search = undefined;
try{
	chat = new Chat();
	search = new Search();
}catch(e){
	console.log("Chat or Search is not defined");
}
/*Required */

/*Optional */
let game = undefined;
let matchs = undefined;
let profile = undefined;
let editProfile = undefined;
let jointournament = undefined;
let tournamentHistory = undefined;
let localGame = undefined;
/*Optional */