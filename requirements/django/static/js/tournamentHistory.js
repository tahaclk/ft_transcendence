class TournamentHistory{
    constructor(){
        this.langText = {
            'tr': {
                "semiMatch": "Yarı Final",
                "thirdPlaceMatch": "Üçüncülük Maçı",
                "finalMatch": "Final Maçı",
                "matchs": "Maçlar",
                "order": "Sıralama"
            },
            'en': {
                "semiMatch": "Semi Final",
                "thirdPlaceMatch": "Third Place Match",
                "finalMatch": "Final Match",
                "matchs": "Matchs",
                "order": "Order"
            },
            'de': {
                "semiMatch": "Halbfinale",
                "thirdPlaceMatch": "Dritter Platz Spiel",
                "finalMatch": "Finale Spiel",
                "matchs": "Spiele",
                "order": "Anordnung"
            }
        }
        $(document).ready(function() {
            $('.tournament-link').on('click', function() {
                var tournamentId = $(this).data('id');
                var tournamentName = $(this).data('name');
                var tournamentDetails = $(this).find('.tournament-details').html();
                
                $('#tournament-detail').html('').hide();
                $('.spinner-border').show();
                
                $.ajax({
                    url: '/tournament-detail/' + tournamentId,
                    method: 'GET',
                    success: function(response) {
                        var detailHtml = '<h2 class="text-success">' + tournamentName + '</h2>';
                        detailHtml += tournamentDetails;
                        detailHtml += '<ul class="list-group fade-in">';
                        detailHtml += `
                            <li class="list-group-item">
                                <div>
                                    <h3>${tournamentHistory.langText[chat.getCookie("language")].order}</h3>
                                </div>
                                <div class="d-flex align-items-end overflow-auto oy-hidden">
                                    <div>
                                        <div class="t-match-p d-flex flex-column gap-1 align-items-center">
                                            <div>
                                                <img class="rounded-circle img-tourn" src="${response.order[0].thumbnail}">
                                            </div>
                                            <div class="order-1 text-break bg-warning p-1 d-flex align-items-start">
                                               <h5 class="text-center m-0">${response.order[0].username}</h5>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div class="t-match-p d-flex flex-column gap-1 align-items-center">
                                            <div>
                                                <img class="rounded-circle img-tourn" src="${response.order[1].thumbnail}">
                                            </div>
                                            <div class="order-2 text-break bg-warning p-1 d-flex align-items-start">
                                                <h5 class="text-center m-0">${response.order[1].username}</h5>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div class="t-match-p d-flex flex-column gap-1 align-items-center">
                                            <div>
                                                <img class="rounded-circle img-tourn border-success" src="${response.order[2].thumbnail}">
                                            </div>
                                            <div class="order-3 text-break bg-warning p-1 d-flex align-items-start">
                                                <h5 class="text-center m-0">${response.order[2].username}</h5>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div class="t-match-p d-flex flex-column gap-1 align-items-center">
                                            <div>
                                                <img class="rounded-circle img-tourn border-success" src="${response.order[3].thumbnail}">
                                            </div>
                                            <div class="order-4 text-break bg-warning p-1 d-flex align-items-start">
                                                <h5 class="text-center m-0">${response.order[3].username}</h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        `;
                        response.matches.forEach(function(match, idx) {

                            let matchName;

                            if (idx == 0 || idx == 1){
                                matchName = tournamentHistory.langText[chat.getCookie("language")].semiMatch;
                            }
                            else if (idx == 2){
                                matchName = tournamentHistory.langText[chat.getCookie("language")].thirdPlaceMatch;
                            }
                            else {
                                matchName = tournamentHistory.langText[chat.getCookie("language")].finalMatch;
                            }

                            detailHtml += `<li class="list-group-item">` + ((idx == 0) ? `<div><h3>${tournamentHistory.langText[chat.getCookie("language")].matchs}</h3></div>` : ``) +
                                            `<div class="t-elem d-flex flex-column">
                                                <div class="t-head d-flex justify-content-between bg-warning p-2">
                                                    <h5 class="d-flex justify-content-center m-0">${matchName}</h5>
                                                </div>
                                                <div class="t-body d-flex gap-2 flex-wrap justify-content-around p-2 bg-primary">
                                                    <!--Eşleşme 1-->
                                                    <div class="t-match-elem-outer d-flex flex-column justify-content-between">
                                                        <div class="t-match-elem d-flex flex-nowrap gap-1">
                                                        <!--Eşleşme 1 Oyuncu 1-->
                                                            <div class="t-match-p d-flex flex-column gap-1 align-items-center">
                                                                <div>
                                                                    <img class="rounded-circle img-tourn" src="${match.p1_thumbnail}"></img>
                                                                </div>
                                                                <div class="text-break">
                                                                    <h5 class="text-center">${match.p1_username}</h5>
                                                                </div>
                                                            </div>
                                                            <div class="d-flex align-items-center text-white">
                                                                <h5>${match.score1} - ${match.score2}</h5>
                                                            </div>
                                                            <!--Eşleşme 1 Oyuncu 2-->
                                                            <div class="t-match-p d-flex flex-column gap-1 align-items-center">
                                                                <div>
                                                                    <img class="rounded-circle img-tourn" src="${match.p2_thumbnail}"></img>
                                                                </div>
                                                                <div class="text-break">
                                                                    <h5 class="text-center">${match.p2_username}</h5>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                          </li>`;
                        });
                        detailHtml += '</ul>';
                        $('#tournament-detail').html(detailHtml).fadeIn();
                    },
                    error: function() {
                        $('#tournament-detail').html('<div class="alert alert-danger fade-in" role="alert">Failed to load tournament details. Please try again later.</div>').fadeIn();
                    },
                    complete: function() {
                        $('.spinner-border').hide();
                    }
                });
            });
        });
    }
}