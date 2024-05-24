class JoinTournament{
    constructor(){
        this.langTexts = {
            "en": {
                "tableJoin": "Join",
                "tableClose": "Close",
                "tableLeave": "Leave",
                "tableInvite": "Invite",
                "semiMatch1": "Semi Match 1",
                "semiMatch2": "Semi Match 2",
                "thirdPlaceMatch": "Third Place Match",
                "finalMatch": "Final Match",
                "semiFinal": "Semi Final",
                "final": "Final"
            },
            "tr": {
                "tableJoin": "Katıl",
                "tableClose": "Kapat",
                "tableLeave": "Ayrıl",
                "tableInvite": "Davet Et",
                "semiMatch1": "Yarı Final 1",
                "semiMatch2": "Yarı Final 2",
                "thirdPlaceMatch": "Üçüncülük Maçı",
                "finalMatch": "Final Maçı",
                "semiFinal": "Yarı Final",
                "final": "Final"
            },
            "de": {
                "tableJoin": "Beitreten",
                "tableClose": "Schließen",
                "tableLeave": "Verlassen",
                "tableInvite": "Einladen",
                "semiMatch1": "Halbfinale 1",
                "semiMatch2": "Halbfinale 2",
                "thirdPlaceMatch": "Dritter Platz Spiel",
                "finalMatch": "Finale Spiel",
                "semiFinal": "Halbfinale",
                "final": "Finale"
            }
        }
        console.log("JoinTournament constructor");
        this.tournamentSocket = new WebSocket('wss://' + chat.localSiteUrl + ':3000/ws/tournament/');
        
        this.tournamentSocket.onopen = (event) => {
			//console.log('WebSocket connection opened:', event);
			this.sendMessage("getActiveTournaments","");
		};

        this.tournamentSocket.onmessage = (event) => {
            console.log('WebSocket message received:', event.data);
            var data = JSON.parse(event.data);
            if(data.mode == "getActiveTournaments"){
                this.getActiveTournaments(data.message);
            }
            else if (data.mode == "joinedTournament"){
                this.joinedTournamentFill(data.message);
            }
            else if (data.mode == "requestGetActiveTournaments"){
                this.sendMessage("getActiveTournaments","");
            }
            else if (data.message.goCheckMatchMaking){
                console.log("GETMATCHPOPUP");
                chat.getMatchPopup(data.message.goCheckMatchMaking);
            }
            else if (data.mode == "error"){
                alert(data.message);
            }
        }

        $(document).ready(function() {

            $("#createTournamentBtn").click(()=>{
                console.log("bassss");
                jointournament.createTournament();
            });

        });
    }

    sendMessage(mode, message){
		this.tournamentSocket.send(JSON.stringify({ "token": chat.getCookie("token"), "mode": mode, "message": message }));
	}
    /*
    {
        "mode": "joinedTournament", 
        "message": {
		    "id": joined.id,
		    "name": joined.name,
		    "gamemode": joined.mode,
		    "timestamp": str(joined.timestamp),
		    "creatorThumbnail": joined.creator.thumbnail.url,
		    "creatorDisplayName": joined.creator.displayname,
		    "creatorUsername": joined.creator.username,
		    "creatorUid": joined.creator.uid,
		    "p1_username": joined.p1.username if joined.p1 else None,
		    "p2_username": joined.p2.username if joined.p2 else None,
		    "p3_username": joined.p3.username if joined.p3 else None,
		    "p4_username": joined.p4.username if joined.p4 else None,
		    "p1_displayname": joined.p1.displayname if joined.p1 else None,
		    "p2_displayname": joined.p2.displayname if joined.p2 else None,
		    "p3_displayname": joined.p3.displayname if joined.p3 else None,
		    "p4_displayname": joined.p4.displayname if joined.p4 else None,
		    "p1_thumbnail": joined.p1.thumbnail.url if joined.p1 else None,
		    "p2_thumbnail": joined.p2.thumbnail.url if joined.p2 else None,
		    "p3_thumbnail": joined.p3.thumbnail.url if joined.p3 else None,
		    "p4_thumbnail": joined.p4.thumbnail.url if joined.p4 else None,
		    "semiMatch1_p1": joined.semiMatch1.player1.username if joined.semiMatch1 else None,
		    "semiMatch1_p2": joined.semiMatch1.player2.username if joined.semiMatch1 else None,
		    "semiMatch2_p1": joined.semiMatch2.player1.username if joined.semiMatch2 else None,
		    "semiMatch2_p2": joined.semiMatch2.player2.username if joined.semiMatch2 else None,
		    "thirdPlaceMatch_p1": joined.thirdPlaceMatch.player1.username if joined.thirdPlaceMatch else None,
		    "thirdPlaceMatch_p2": joined.thirdPlaceMatch.player2.username if joined.thirdPlaceMatch else None,
		    "finalMatch_p1": joined.finalMatch.player1.username if joined.finalMatch else None,
		    "finalMatch_p2": joined.finalMatch.player2.username if joined.finalMatch else None,
        }
    }	
    */
    joinedTournamentFill(message){
        let players = {};
        let matchs = [];
        let semiOrFinal = this.langTexts[chat.getCookie("language")].semiFinal;//langtext gerekiyor
        if (message.p1_username && message.p2_username && message.p3_username && message.p4_username){
            players[message.p1_username] = {"username": message.p1_username, "displayname": message.p1_displayname, "thumbnail": message.p1_thumbnail};
            players[message.p2_username] = {"username": message.p2_username, "displayname": message.p2_displayname, "thumbnail": message.p2_thumbnail};
            players[message.p3_username] = {"username": message.p3_username, "displayname": message.p3_displayname, "thumbnail": message.p3_thumbnail};
            players[message.p4_username] = {"username": message.p4_username, "displayname": message.p4_displayname, "thumbnail": message.p4_thumbnail};
        }else return;
        if (message.finalMatch_p1 && message.finalMatch_p2 && message.thirdPlaceMatch_p1 && message.thirdPlaceMatch_p2){
            matchs.push({"p1": message.finalMatch_p1, "p2": message.finalMatch_p2});
            matchs.push({"p1": message.thirdPlaceMatch_p1, "p2": message.thirdPlaceMatch_p2});
            semiOrFinal = this.langTexts[chat.getCookie("language")].final;
        }
        else if (message.semiMatch1_p1 && message.semiMatch1_p2 && message.semiMatch2_p1 && message.semiMatch2_p2){
            matchs.push({"p1": message.semiMatch1_p1, "p2": message.semiMatch1_p2});
            matchs.push({"p1": message.semiMatch2_p1, "p2": message.semiMatch2_p2});
        }else return;
        
        let element = `
        <div class="t-elem d-flex flex-column">
            <div class="t-head d-flex justify-content-between bg-warning p-2">
                <h4 class="d-flex justify-content-center m-0">${message.name}</h4>
                <h4 class="d-flex justify-content-center m-0">${semiOrFinal}</h4>
                <h4 class="d-flex justify-content-center m-0">${message.timestamp}</h4>
            </div>
            <div class="t-body d-flex gap-2 flex-wrap justify-content-around p-2 bg-primary">
                <!--Eşleşme 1-->
                <div class="t-match-elem-outer d-flex flex-column justify-content-between">
                    <div class="t-match-elem d-flex flex-nowrap gap-1">
                    <!--Eşleşme 1 Oyuncu 1-->
                        <div class="t-match-p d-flex flex-column gap-1 align-items-center">
                            <div>
                                <img class="rounded-circle img-tourn" src="${players[matchs[0].p1].thumbnail}"></img>
                            </div>
                            <div class="text-break">
                                <h5 class="text-center">${players[matchs[0].p1].displayname}</h5>
                            </div>
                        </div>
                        <div class="d-flex align-items-center text-white">
                            <h4>VS</h4>
                        </div>
                        <!--Eşleşme 1 Oyuncu 2-->
                        <div class="t-match-p d-flex flex-column gap-1 align-items-center">
                            <div>
                                <img class="rounded-circle img-tourn" src="${players[matchs[0].p2].thumbnail}"></img>
                            </div>
                            <div class="text-break">
                                <h5 class="text-center">${players[matchs[0].p2].displayname}</h5>
                            </div>
                        </div>
                    </div>
                    <div class="bg-warning p-1">
                        <h4 class="m-0 text-center text-white">${message.thirdPlaceMatch_p1 ? this.langTexts[chat.getCookie("language")].thirdPlaceMatch : this.langTexts[chat.getCookie("language")].semiMatch1}</h4>
                    </div>
                </div>
                <!--Eşleşme 2-->
                <div class="t-match-elem-outer d-flex flex-column justify-content-between">
                    <div class="t-match-elem d-flex flex-nowrap gap-1">
                        <!--Eşleşme 2 Oyuncu 1-->
                        <div class="t-match-p d-flex flex-column gap-1 align-items-center">
                            <div>
                                <img class="rounded-circle img-tourn" src="${players[matchs[1].p1].thumbnail}"></img>
                            </div>
                            <div class="text-break">
                                <h5 class="text-center">${players[matchs[1].p1].displayname}</h5>
                            </div>
                        </div>
                        <div class="d-flex align-items-center text-white">
                            <h4>VS</h4>
                        </div>
                        <!--Eşleşme 2 Oyuncu 2-->
                        <div class="t-match-p d-flex flex-column gap-1 align-items-center">
                            <div>
                                <img class="rounded-circle img-tourn" src="${players[matchs[1].p2].thumbnail}"></img>
                            </div>
                            <div class="text-break">
                                <h5 class="text-center">${players[matchs[1].p2].displayname}</h5>
                            </div>
                        </div>
                    </div>
                    <div class="bg-warning p-1">
                        <h4 class="m-0 text-center text-white">${message.finalMatch_p1 ? this.langTexts[chat.getCookie("language")].finalMatch : this.langTexts[chat.getCookie("language")].semiMatch2}</h4>
                    </div>
                </div>
            </div>
        </div>
        `;
        $(".t-container").html("");
        $(".t-container").append(element);
    }

    getActiveTournaments(tournaments){
        $("#tableBody").html("");
        tournaments.forEach(t => {
            let tr = $("<tr scope='row'>").attr("data-tournament-id", `${t.id}`);
            let th = $("<th class='py-2 px-4'>").text(`${(100000 + t.id).toString()}`);
            let td1 = $("<td class='py-2 px-4'>").text(`${t.name}`);
            let td2 = $("<td class='py-2 px-4'>");
            let a = $("<a>").attr("data-href", `user/${t.creatorUsername}`).addClass("route-link cursor-pointer d-flex gap-1 align-items-center text-decoration-none text-black");
            let img = $("<img>").addClass("rounded-circle img-chat").attr("src", `${t.creatorThumbnail}`).attr("alt", "");
            let h5 = $("<h5>").addClass("extra-small-text").text(`${t.creatorDisplayName}`);
            a.append(img, h5);
            td2.append(a);
            
            let td3 = $("<td class='py-2 px-4 text-capitalize'>").text(`${t.gamemode}`);
            let td4 = $("<td class='py-2 px-4'>").text(`${t.players}/4`);
            let td5 = $("<td class='py-2 px-4'>");
            
            let button;
            let inviteModalBtn;//modal button
            let modalBody = undefined;
            if (ownUid == t.creatorUid){
                button = $("<button id='closeBtn'>").addClass("btn btn-danger mb-2 me-2").text(`${this.langTexts[chat.getCookie("language")].tableClose}`);
                inviteModalBtn = $(`<button type="button" class="btn btn-primary mb-2 invite-btn" data-bs-toggle="modal" data-bs-target="#exampleModalCenter" onClick="$('#exampleModalCenter').attr('data-tournament-id2', ${t.id})">${this.langTexts[chat.getCookie("language")].tableInvite}</button>`);
            }
            else if (t.joinedUids.find((uid) => uid == ownUid) != undefined)
                button = $("<button id='leaveBtn'>").addClass("btn btn-outline-danger").text(`${this.langTexts[chat.getCookie("language")].tableLeave}`);
            else
                button = $("<button id='joinBtn'>").addClass(`btn btn-success ${t.joinedUids.find((uid) => uid == ownUid) == undefined ? "" : "disabled"}`).text(`${this.langTexts[chat.getCookie("language")].tableJoin}`);
            td5.append(button, inviteModalBtn);
            tr.append(th, td1, td2, td3, td4, td5);
            $("#tableBody").append(tr);
            function tournamentBtn(e){
                if ($(e.target).attr("id") == "joinBtn"){
                    let id = $(e.target).closest("tr").attr("data-tournament-id");
                    jointournament.sendMessage("join-tournament", {"tournamentID": id});
                    jointournament.sendMessage("getActiveTournaments","");
                }
                else if ($(e.target).attr("id") == "leaveBtn"){
                    let id = $(e.target).closest("tr").attr("data-tournament-id");
                    jointournament.sendMessage("leave-tournament", {"tournamentID": id});
                    jointournament.sendMessage("getActiveTournaments","");
                }
                else if ($(e.target).attr("id") == "closeBtn"){
                    let id = $(e.target).closest("tr").attr("data-tournament-id");
                    jointournament.sendMessage("close-tournament", {"tournamentID": id});
                    jointournament.sendMessage("getActiveTournaments","");
                }
            }
            $(button).off("click");
            $(button).on("click", tournamentBtn);
        });
        let modalBody = $(`<div class="modal fade" id="exampleModalCenter" data-tournament-id2="-1" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-content">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h1 class="modal-title fs-5" id="exampleModalLabel">Davet Listesi</h1>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="d-flex flex-column align-items-center gap-2 inviteList" id="inviteList">
                                <!--Invited Person-->
                            </div>
                        </div>
                    </div>
                </div>
            </div>`);
        $("#tableBody").append(modalBody);
    }

    resetInputs(){
        $("#exampleFormControlSelect1").val("empty");
        $("#tournamentName").val("");
    }

    createTournament(){
        let mode = $("#exampleFormControlSelect1").val();
        let name = $("#tournamentName").val();
        if (mode != "classic" && mode != "powerups" && mode != "boosted"){
            console.log("sg");
            return;
        }
        if (chat.escapeHtml(name).trim() == "")
        {
            console.log("sg2");
            return;
        }
        this.sendMessage("create-tournament", {"mode": `${mode}`, "name": `${name}`},);
        this.resetInputs();
    }
}
/* "id": active.id,
"name": active.name,
"gamemode": active.game,
"players": active.getPlayerCount(),
"creatorThumbnail": active.creator.thumbnail,
"creatorDisplayName": active.creator.display_name,
"creatorUsername": active.creator.username,
"status": active.status,
"timestamp": active.timestamp */


{/*

<!-- Modal -->
 */}