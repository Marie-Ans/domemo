// Chaque domino a les propriétés suivantes : src (l'image qui le représente), une position en ligne, une position en colonne, un etat (0: mystere, 1:visible, 2 : trouvée);


var Domino = function (src, ligne, colonne, etat) {
    this.src = src,
        this.ligne = ligne,
        this.colonne = colonne,
        this.etat = etat
}

var Domemo = function () {
    this.dominos = ['/img/dominos/1_1.png', '/img/dominos/2_2.png', '/img/dominos/3_3.png', '/img/dominos/4_4.png', '/img/dominos/5_5.png'];
    this.enCours = false;
    this.positions = [];
    this.joueurUn = null;
        /*Si instanciation, données récupérées du serveur :
        idClient
        pseudo 
        avatar
        joueur = 1 (=2 pour j2)
        scores
        duree
        */
    this.joueurDeux = null;
    this.joueurCourant = 0;
    this.dominosTires = 0;
    this.pairesTrouvees = 0;
    this.afficherClients = function (clients, pseudoClient) {
        $('#clients>.infos:first').empty();
        clients.forEach(function(client){
            if(client.pseudo === pseudoClient){
                $('#clients>.infos:first').append('<p class="pseudo" id="'+client.pseudo+'"><b>-'+client.pseudo+' (Vous)</b></p>');
            }
            else {
                $('#clients>.infos:first').append('<p class="pseudo" id="'+client.pseudo+'">-'+client.pseudo+'</p>');
            }
        })
    },
    this.chargerEtatJeu = function(etat){
        this.enCours = etat.enCours
        this.positions = etat.positions;
        this.joueurUn = etat.joueurUn;
        this.joueurDeux = etat.joueurDeux;
        this.joueurCourant = etat.joueurCourant;
        this.pairesTrouvees = etat.pairesTrouvees;
        if(etat.dominoUnCourant === null && etat.dominoDeuxCourant === null){
            this.dominosTires =0;
        }
    },
    this.afficherJoueurs = function(pseudoClient){
        $('.trophee').remove();
        if(this.joueurUn !=null){
            $('img.avatar:first').attr('src', this.joueurUn.avatar);
            $('p.pseudoJoueur:first').text(this.joueurUn.pseudo).css('fontWeight', 'bold');
            $('p.paires:first').html('Paires gagnées : <span>' + this.joueurUn.pairesGagnees + '</span>');
            $('#rejoindreJoueurUn').addClass('masque');
        } else {
            $('img.avatar:first').attr('src', '');
            $('p.pseudoJoueur:first').text('');
            $('p.paires:first').html('');
            $('#quitterJoueurUn').addClass('masque');
            $('#rejoindreJoueurUn').removeClass('masque');
            if (this.joueurDeux!=null && this.joueurDeux.pseudo === pseudoClient){
                $('#rejoindreJoueurUn').addClass('masque');
            } else {
                $('#rejoindreJoueurUn').removeClass('masque');
            }
        }
        if(this.joueurDeux != null){
            $('img.avatar:last').attr('src', this.joueurDeux.avatar);
            $('p.pseudoJoueur:last').text(this.joueurDeux.pseudo).css('fontWeight', 'bold');
            $('p.paires:last').html('Paires gagnées : <span>' + this.joueurDeux.pairesGagnees + '</span>');
            $('#rejoindreJoueurDeux').addClass('masque');
        } else {
            $('img.avatar:last').attr('src', '');
            $('p.pseudoJoueur:last').text('');
            $('p.paires:last').html('');
            $('#quitterJoueurDeux').addClass('masque');
            $('#rejoindreJoueurDeux').removeClass('masque');
            if (this.joueurUn!=null && this.joueurUn.pseudo === pseudoClient){
                $('#rejoindreJoueurDeux').addClass('masque');
            } else {
                $('#rejoindreJoueurDeux').removeClass('masque');
            }
        } 
        
        if(this.joueurUn!=null && pseudoClient === this.joueurUn.pseudo){
            $('#quitterJoueurUn').removeClass('masque');
            $('#rejoindreJoueurDeux').addClass('masque');
        }
        if(this.joueurDeux!=null && pseudoClient === this.joueurDeux.pseudo){
            $('#quitterJoueurDeux').removeClass('masque');
            $('#rejoindreJoueurUn').addClass('masque');
        }
        if(this.joueurCourant === 1){
            $('.zoneJoueur:first').addClass('joueurCourant');
            $('.zoneJoueur:last').removeClass('joueurCourant');
        } 
        if(this.joueurCourant === 2){
            $('.zoneJoueur:last').addClass('joueurCourant');
            $('.zoneJoueur:first').removeClass('joueurCourant');
        } 
        if(this.joueurCourant === 0){
            $('.zoneJoueur:first').removeClass('joueurCourant');
            $('.zoneJoueur:last').removeClass('joueurCourant');
        }
    },
    this.afficherInfosPartie = function () {
        $('#infoJeu>h4').css({ 'background-color': '', 'text-align':'left', 'color':'black'});
        if(this.enCours){
            if(this.joueurCourant === 1){
                $('#infoJeu>h4').text('Au tour de ' + this.joueurUn.pseudo + ' : en attente du clic sur un domino mystère.').css('color','black');
            }
            if (this.joueurCourant === 2){
                $('#infoJeu>h4').text('Au tour de ' + this.joueurDeux.pseudo + ' : en attente du clic sur un domino mystère.').css('color','black');
            }
        } else {
            $('#infoJeu>h4').text("EN ATTENTE DE DEUX JOUEURS POUR COMMENCER LA PARTIE").css('color','black');
        }
    };
    this.afficherDamier = function () { 
        $('.domino').css('background-image','');
        if (this.enCours){
            for (var j = 0; j < this.positions.length; j++) {
                var ligne = $('#ligne' + this.positions[j].ligne + '>div');
                var colonne = this.positions[j].colonne;
                var src = 'url(' + this.positions[j].src + ')';
                $(ligne[colonne]).removeClass('unavailable');
                switch (this.positions[j].etat) {
                    case 0:
                        $(ligne[colonne]).addClass('mystery');
                        break;
                    case 1:
                        $(ligne[colonne]).removeClass('mystery');
                        $(ligne[colonne]).css('background-image', src);
                        break;
                    case 2:
                        $(ligne[colonne]).removeClass('mystery');
                        $(ligne[colonne]).addClass('founded');
                        break;
                }
            }
        } else {
            $('.domino').css('background-image', '');
            $('.domino').removeClass('mystery');
            $('.domino').removeClass('founded');
            $('.domino').addClass('unavailable');
        } 
    };
    this.ajoutePaireScore = function(gagnant) {
        if (gagnant === 1) {
            $('.paires:first>span').text(parseFloat($('.paires:first>span').text()) + 1);
        } else {
            $('.paires:last>span').text(parseFloat($('.paires:last>span').text()) + 1);
        }
    };
    this.afficherPartieGagnee = function(gagnant){
        $('.bouton').addClass('masque');
        if(gagnant === 1){
            $('.avatar:first').after(function () {
                return "<img class='trophee' src='img/dominos/trophee.png'>";
            });
            $('.zoneJoueur:first').addClass('joueurCourant');
            $('.zoneJoueur:last').removeClass('joueurCourant');
        } else {
            $('.avatar:last').after(function () {
                return "<img class='trophee' src='img/dominos/trophee.png'>";
            });
            $('.zoneJoueur:last').addClass('joueurCourant');
            $('.zoneJoueur:first').removeClass('joueurCourant');
        }
    };
    this.masquerJoueurForfait = function(gagnant){
        if(gagnant === 1){
            $('img.avatar:last').attr('src', '');
            $('p.pseudoJoueur:last').text('');
            $('p.paires:last').text('');
            $('#rejoindreJoueurDeux').addClass('masque');
            $('#quitterJoueurDeux').addClass('masque');
        } else {
            $('img.avatar:first').attr('src', '');
            $('p.pseudoJoueur:first').text('');
            $('p.paires:first').text('');
            $('#rejoindreJoueurUn').addClass('masque');
            $('#quitterJoueurUn').addClass('masque'); 
        }
    };
    this.afficherHistoriqueScores = function (infosClients,pseudoClient) {
        for(var i = 0; i<infosClients.length;i++){
            if($('#sc_'+infosClients[i].pseudo).length!=0){
                var info_partGagnees = '#sc_' + infosClients[i].pseudo + ' + ul li:first>.success';
                var info_partPerdues = '#sc_' + infosClients[i].pseudo + ' + ul li:first>.error';
                var info_paires = '#sc_' + infosClients[i].pseudo + ' + ul li:nth-child(2)';
                var info_duree = '#sc_' + infosClients[i].pseudo + ' + ul li:last';
                $(info_partGagnees).text(infosClients[i].scores.parties_gagnees);
                $(info_partPerdues).text(infosClients[i].scores.parties_perdues);
                $(info_paires).text('- Paires empochées : ' + infosClients[i].scores.paires_gagnees);
                $(info_duree).text('- Durée de jeu : ' + infosClients[i].duree.heures + 'h ' + infosClients[i].duree.minutes + 'm ' + infosClients[i].duree.secondes + 's');
            }
            else {
                if(infosClients[i].parties_gagnees!=0 || infosClients[i].parties_perdues!=0){
                    var nouveauScorePseudo = '<p id="sc_'+infosClients[i].pseudo+'" class="pseudo">'+infosClients[i].pseudo.toUpperCase();
                    var infoHistorique = '<ul><li>- Partie gagnées - perdues : <span class="success">'+infosClients[i].scores.parties_gagnees+'</span> -  <span class="error">'+infosClients[i].scores.parties_perdues+'</span></li><li> - Paire empochées : '+infosClients[i].scores.paires_gagnees+'</li><li>Durée de jeu : '+ infosClients[i].duree.heures + 'h ' + infosClients[i].duree.minutes + 'm ' + infosClients[i].duree.secondes + 's</li></ul>';
                    $('#scores .infos').append(nouveauScorePseudo+infoHistorique);
                }
            }
        }
    };
    this.reinitialiserJeu = function () {
        this.partieEnCours = false;
        this.dominosTires = 0;
        this.positions = [];
        this.joueurUn = null;
        this.joueurDeux = null;
        this.joueurCourant = 0;
        this.pairesTrouvees = 0;
        this.afficherDamier();
        this.afficherInfosPartie();
        this.masquerJoueur(1);
        this.masquerJoueur(2);
        $('#infoJeu>h4').css({ "background-color": "", "text-align": "left" });
        $('.trophee').remove();
    };
    this.chercheDomino = function (ligne, colonne) {
        for (var i = 0; i < this.positions.length; i++) {
            if (this.positions[i].ligne === ligne && this.positions[i].colonne === colonne) {
                return this.positions[i];
            }
        }
    };
    this.estJoueurCourant = function (pseudoClient) {
        if (this.enCours 
            && (
                (pseudoClient === this.joueurUn.pseudo && this.joueurCourant === 1)
                || 
                (pseudoClient === this.joueurDeux.pseudo && this.joueurCourant === 2)
            )
        ) {
            return true;
        } else {
            return false;
        }
    };
}