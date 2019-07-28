'use strict';

$(document).ready(function(){

    ///// DECLARATION DES VARIABLES GLOBALES
    /**
     * socket = connexion WebSocket
     * domemo = objet contenant les infos sur le jeu  (voir dominos.js)
     * pseudoClient = issu du Dom, le pseudo du client connecté.
     * stopAffichaeResTour : id du setTimeOut pour l'arrêter si action "contradictoire".
     */
        
    var socket = io('https://marieans.herokuapp.com/');
    //var socket = io('http://localhost:8080');

    var pseudoClient = $('header a').attr('id');

    var domemo = new Domemo();

    var stopAffichageResTour;

   
    /** MISE A JOUR DE LA LISTE DES CLIENTS CONNECTES
     * En réponse au serveur lorsqu'un client se connecte ou se déconnecte.
     */
    socket.on('afficherClientsConnectes', function(data){
        domemo.afficherClients(data, pseudoClient);
    });

    /** MISE A JOUR DE L'ETAT DU JEU
     * En réponse au serveur lorsqu'un client se connecte ou se déconnecte, quand un client rejoint ou quitte la partie.
     */
    socket.on('afficherJeu', function(data){
        clearTimeout(stopAffichageResTour);
        domemo.chargerEtatJeu(data);
        domemo.afficherJoueurs(pseudoClient);
        domemo.afficherInfosPartie();
        domemo.afficherDamier();
    });
    

    /** CLIC SUR BOUTONS REJOINDRE ET QUITTER LA PARTIE
     * Le client veut rejoindre la partie en tant que joueur Un ou joueur Deux : envoi de la requête rejoindreJeu au serveur
     * Le client, joueur Un ou joueur Deux veut quitter la partie : envoi de la requête quitterJeu 
     */
    $('.bouton').on('click',function(){
        switch ($(this).attr('id')){
            case "rejoindreJoueurUn" : 
                socket.emit('rejoindreJeu', [1, pseudoClient]);
            break;
            case "rejoindreJoueurDeux" : 
                socket.emit('rejoindreJeu', [2, pseudoClient]);
            break;
            case "quitterJoueurUn" : 
                socket.emit('quitterJeu', [1, pseudoClient]);
            break;
            case "quitterJoueurDeux" : 
                socket.emit('quitterJeu', [2, pseudoClient]);
            break;
        }
    });

    /** SURVOL DES DOMINOS
     * Si la partie est en cours, alors les dominos cachés changent de couleur au passage de la souris, mais uniquement pour le client qui est le joueur courant.
     * Suppression de la classe hov pour tous les clients lorsque la souris quitte un domino (permet de gérer le cas où la partie s'est terminée prématurément mais que la souris du joueur est sur un domino)
    */
    $('.domino').hover(
 
        function(){
            if(domemo.estJoueurCourant(pseudoClient) && domemo.dominosTires<2){
                $(this).addClass('hov');
            }
        },
        function(){
            $(this).removeClass('hov');
        }
    );


    /** CLIC SUR LES DOMINOS
     * Si la partie est en cours, et que le joueurCourant clique sur un domino, alors récupération des coordonnées du domino caché et envoie d'une requete au serveur pour traitement.
     */
    $('.domino').on('click', function(){
        if(domemo.estJoueurCourant(pseudoClient) && domemo.dominosTires<2){
            domemo.dominosTires++;
            var position = $(this).attr('id');
            var regex = new RegExp('(^.*)_');
            var ligne = position.match(regex)[1];
            var colonne = parseFloat(position.substr(position.length-1));

            socket.emit('traiteDomino', domemo.chercheDomino(ligne, colonne));
        }
    });

    /** REPONSE TRAITEMENT DOMINO CLIQUE / MISE A JOUR AFFICHAGE DOMINO
     * Mise à jour de domemo.positions (l'état du domino cliqué a été changé par le serveur)
     * Appel de la fonction afficherDamier qui affichent les dominos selon leur état (0 : pas trouvé, 1:cliqué dont image du domino, 2:trouvé)=>le domino cliqué est donc affiché.
     */
    socket.on('afficheDominos', function(data){
        domemo.positions = data;
        domemo.afficherDamier();
    });

    /** REPONSE TRAITEMENT DOMINO CLIQUE / MISE A JOUR ZONE INFOS PARTIES
     * Affichage du message en fonction du résultat du tour (trouvée ou non)
     * Au bout de 3 secondes, mise à jour de l'affichage
     * (stopAffichageResTour : permet de bloquer l'action si une action contradictoire survient avant les 3000ms : par exemple, un joueur quitte la partie.
     */
    socket.on('resultatTour', function(data){
          if(data[0]){
            $('#infoJeu>h4').text('PAIRE GAGNEE!').css('color','green');
            domemo.ajoutePaireScore(data[1].joueurCourant);
            domemo.pairesTrouvees++;
        } else {
            $('#infoJeu>h4').text('DOMMAGE, AU PROCHAIN TOUR PEUT ETRE!').css('color','red');
        }
        stopAffichageResTour = setTimeout(function(){ 
            domemo.dominosTires = 0;
            domemo.chargerEtatJeu(data[1]);
            domemo.afficherJoueurs();
            domemo.afficherInfosPartie();
            domemo.afficherDamier();
        }, 3000);
    });

    /** REPONSE TRAITEMENT DOMINO CLIQUE / PARTIE GAGNEE
     * Affichage du message Victoire
     * Au bout de 5000 ms, appel du serveur pour réinitialiser le jeu
     */
    socket.on('partieGagnee', function(data){
        $('#infoJeu>h4').text(data[1].pseudo +' a gagné!!! BRAVO!!!').css({ 'background-color': '#0ca0c1', 'text-align':'center','color':'black'});
        domemo.ajoutePaireScore(data[0]);
        domemo.afficherPartieGagnee(data[0]);
        setTimeout(function(){ 
            socket.emit('reinitialisation');
        }, 5000);
    });

    /** UN JOUEUR A QUITTE LA PARTIE EN COURS (Au moins une paire avait été gagnée)
     * Arret eventuel du setTimeOut d'affichage du message après résultat d'un tour
     * Affichage du message Victoire par forfait
     * Au bout de 5000 ms, appel du serveur pour réinitialiser le jeu
     */
    socket.on('partieGagneeParForfait', function(data){
        clearTimeout(stopAffichageResTour);

        $('#infoJeu>h4').text(data[1].pseudo +' a gagné par forfait, car '+data[2].pseudo+' a quitté la partie').css({ 'background-color': '#0ca0c1', 'text-align':'center','color':'black'});
    
        domemo.afficherPartieGagnee(data[0]);
        domemo.masquerJoueurForfait(data[0]);
        setTimeout(function(){
            socket.emit('reinitialisation');
        },5000);
    });

    /** REINITIALISATION DE L'AFFICHAGE DU JEU APRES VICTOIRE (ET VICTOIRE PAR FORFAIT)
     */
    socket.on('reinitialiserAffichage',function(data){
        domemo.chargerEtatJeu(data.partie);
        domemo.afficherClients(data.infoClients, pseudoClient);
        domemo.afficherHistoriqueScores(data.infoClients)
        domemo.dominosTires = 0;
        domemo.afficherJoueurs(pseudoClient);
        domemo.afficherInfosPartie();
        domemo.afficherDamier();
    })
   
     /** UN CLIENT SE DECONNECTE OU FERME LE NAVIGATEUR
     */
    window.addEventListener('beforeunload', function (e) {
        socket.emit('traiterClientDeconnecte', pseudoClient);
    });

});
 
 
 




