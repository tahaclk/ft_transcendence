class JoinTournament{
    constructor(){
        this.langTexts = {
            "en": {
                "tableJoin": "Join",
                "tableClose": "Close",
                "tableLeave": "Leave",
                "tableInvite": "Invite"
            },
            "tr": {
                "tableJoin": "Katıl",
                "tableClose": "Kapat",
                "tableLeave": "Ayrıl",
                "tableInvite": "Davet Et"
            },
            "de": {
                "tableJoin": "Beitreten",
                "tableClose": "Schließen",
                "tableLeave": "Verlassen",
                "tableInvite": "Einladen"
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