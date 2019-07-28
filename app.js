'use strict';
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 8080;

const session = require('express-session');

const state = require('./middleware/state');
const constructionJeu = require('./middleware/constructionJeu');

/////////////// LOCALISATION DES FICHIERS //////////////

/// TEMPLATES
app.set('view engine', 'pug');
app.set('views', 'views');


/// FICHIERS STATIQUES
app.use('/lib', express.static(__dirname + '/public/lib'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/img', express.static(__dirname + '/public/img'));
app.use('/js', express.static(__dirname + '/public/js'));

// app.use(function (req, res, next) {
//     app.locals.server = server;
//     next();
// });

////////////////////////////// SESSION /////////////////////////////
app.use(session({
    secret: 'my secret text',
    resave: false,
    saveUninitialized: true,
    cookie:
    {
        httpOnly: true
    }
}));


//////////////////////// ROUTE PRINCIPALE /////////////////////////
app.use("/", require("./routing"));


/////////////// SI AUCUNE ROUTE RECONNUE ALORS 404 ///////////////
// GET
app.use(function (req, res, next) {
    datas.title = 'Erreur 404';
    datas.msg = 'La page demandée n\'existe pas';
    if (req.session && req.session.client) {
        datas.session = req.session.client
        app.locals.session = req.session;
        if(state.idClients.indexOf(req.session.client.idClient)===-1){
            state.infoClients.push(req.session.client);
            state.idClients.push(req.session.client.idClient);
        }
    }
    res.render('404', datas);
});




////////////////////////// SERVEUR WS ///////////////////////////
/////////////////////////////////////////////////////////////////

const io = require('socket.io')(server);
io.sockets.on('connection', function (client) {


    /////////// UN CLIENT VIENT DE SE CONNECTER /////////////
    // A tous : mise à jour de la liste des clients connectés
    // Au client concerné : l'état du jeu
    io.emit('afficherClientsConnectes', (state.infoClients));
    client.emit('afficherJeu', state.partie);


    /////////// REJOINDRE OU QUITTER PARTIE /////////////

    /** REJOINDRE LA PARTIE 
     * Mise à jour de l'objet state avec les infos du joueur Un ou joueur Deux selon les valeurs passées en paramètre
     * si joueurUn et JoueurDeux existent, alors state.partie.enCours = true, state.partie.joueurCourant = 1 et appel de la fonction constructionJeu qui retourne state.partie.positions (avec une position aléatoire pour chacun des dominos)
     * Renvoi des informations sur le jeu à tous les clients.
     */
    client.on('rejoindreJeu', function (data) {
        let client = state.retourneIndiceClient(data[1]);
        //Le client veut rejoindre la partie en tant que joueur Un
        if (data[0] === 1) {
            state.infoClients[client].joueur = 1;
            state.partie.joueurUn = state.infoClients[client];
            state.partie.joueurUn.pairesGagnees = 0;
            state.partie.joueurUn.nbDominos = 0;
        }
        //Le client veut rejoindre la partie en tant que joueur Deux
        if (data[0] === 2) {
            state.infoClients[client].joueur = 2;
            state.partie.joueurDeux = state.infoClients[client];
            state.partie.joueurDeux.pairesGagnees = 0;
            state.partie.joueurDeux.nbDominos = 0;
        } 
       
        //Si les deux joueurs existent, alors la partie démarre
        if (state.partie.joueurUn != null & state.partie.joueurDeux != null) {
            state.partie.enCours = true;
            state.partie.debut = Date.now();
            state.partie.fin = 0;
            state.partie.positions = constructionJeu.initialiserPositions();
            state.partie.joueurCourant = 1;
            state.partie.dominoUnCourant = null;
            state.partie.dominoDeuxCourant = null;
            state.partie.pairesTrouvees = 0;
        }

        // Envoi des informations sur la partie à tous les clients.
        io.emit('afficherJeu', state.partie);
    });

    /** QUITTER LA PARTIE : 
     * Traitement de deux situations : le jeu est en cours et au moins une paire a été trouvée (dans ce cas victoire par forfait), aucune paire n'avait été trouvée. 
     */
    client.on('quitterJeu', function (data) {
        //on traite le cas où la partie avait commencé et au moins une paire trouvée.
        if(state.partie.pairesTrouvees>0){
            if(data[0] === 1){
                state.partie.joueurCourant === 2;
                io.emit('partieGagneeParForfait', [2, state.partie.joueurDeux, state.partie.joueurUn]);
                state.partie.joueurDeux.vainqueur = true;
                state.partie.joueurUn.vainqueur = false;
                state.partie.joueurUn.pairesGagnees = 0;
            } else {
                state.partie.joueurCourant === 1;
                io.emit('partieGagneeParForfait', [1, state.partie.joueurUn, state.partie.joueurDeux]);
                state.partie.joueurUn.vainqueur = true;
                state.partie.joueurDeux.vainqueur = false;
                state.partie.joueurDeux.pairesGagnees = 0;
            }
            state.partie.fin = Date.now();
            state.mettreAJourInfosClient(state.partie.joueurUn);
            state.mettreAJourInfosClient(state.partie.joueurDeux);
            
        } else {
            let client = state.retourneIndiceClient(data[1]);
            state.infoClients[client].joueur = 0;
            state.partie.enCours = false;
            state.partie.debut = 0;
            state.partie.positions = [];
            state.partie.joueurCourant = 0;
            state.partie.pairesTrouvees = 0;
            if (data[0] === 1) {
                state.partie.joueurUn = null;
            } else {
                state.partie.joueurDeux = null;
            }
            io.emit('afficherJeu', state.partie);

        }
    });

     /** TRAITEMENT APRES CLIC SUR DOMINO : 
     * Affichage du domino chez les clients
     * Puis, en fonction de la situation
     * - premier domino tiré : stockage du domino dans state.partie.dominoUn
     * - seconde domino tiré :  en fonction de la situation
     *   > domino1 et domino2 égaux alors si toutes les paires trouvées, envoyer réponse PartieGagnées à tous, sinon renvoyer réponse ResultatTour true
     *   >sinon renvoyer réponse ResultatTour false et changer de joueur COurant
     */
    client.on('traiteDomino', function (data) {

        state.changeEtatDomino(data, 1);
        io.emit('afficheDominos', state.partie.positions);

        if (state.partie.dominoUnCourant === null) {
            state.partie.dominoUnCourant = data;
        }

        else {
            state.partie.dominoDeuxCourant = data;

            if(state.partie.dominoUnCourant.src === state.partie.dominoDeuxCourant.src){
                state.changeEtatDomino(state.partie.dominoUnCourant, 2);
                state.changeEtatDomino(state.partie.dominoDeuxCourant, 2);
                state.ajoutePaireJoueurCourant();
                state.partie.pairesTrouvees++;

                if(state.partie.pairesTrouvees === 9){
                    if(state.partie.joueurUn.pairesGagnees > state.partie.joueurDeux.pairesGagnees){
                        state.partie.joueurUn.vainqueur = true;
                        state.partie.joueurDeux.vainqueur = false;
                        io.emit('partieGagnee', [1, state.partie.joueurUn]);
                    } else {
                        state.partie.joueurDeux.vainqueur = true;
                        state.partie.joueurUn.vainqueur = false;
                        io.emit('partieGagnee', [2, state.partie.joueurDeux]);
                    }
                    state.partie.fin = Date.now();
                    state.mettreAJourInfosClient(state.partie.joueurUn);
                    state.mettreAJourInfosClient(state.partie.joueurDeux);
                } else {
                    io.emit('resultatTour', [true, state.partie]);
                }
            } else {
                state.changeEtatDomino(state.partie.dominoUnCourant, 0);
                state.changeEtatDomino(state.partie.dominoDeuxCourant, 0);
                state.changeJoueurCourant();
                io.emit('resultatTour', [false, state.partie]);
            }
            state.partie.dominoUnCourant = null;
            state.partie.dominoDeuxCourant = null;
        }
    });

    /** REINITALISATION DU JEU : APRES VICTOIRE OU FORFAIT
     * l'objet state.partie reprend ces valeurs initiales 
     */
    client.on('reinitialisation', function () {
        state.reinitialiserJeu();
        io.emit('reinitialiserAffichage', state);
    });

    /**UN CLIENT SE DECONNECTE
     * Suppression du client de la liste des clients connectés
     * Puis réponse en fonction de la situation, si le client est un joueur ou non, si au moins une paire avait été gagnée.
     */
    client.on('traiterClientDeconnecte', function(data){
        let indiceClient = state.retourneIndiceClient(data);
        let idClient = state.retourneIndiceIdClient(data);
        state.infoClients.splice(indiceClient,1);
        state.idClients.splice(idClient,1);
        io.emit('afficherClientsConnectes', (state.infoClients));

        if(state.partie.joueurUn!=null && data === state.partie.joueurUn.pseudo){
            if(state.partie.enCours && state.partie.pairesTrouvees >0){
                state.partie.joueurCourant === 2;
                io.emit('partieGagneeParForfait', [2, state.partie.joueurDeux, state.partie.joueurUn]);
                state.partie.joueurDeux.vainqueur = true;
                state.partie.joueurUn.vainqueur = false;
                state.partie.joueurUn.pairesGagnees = 0;
                state.partie.fin = Date.now();
                state.mettreAJourInfosClient(state.partie.joueurUn);
                state.mettreAJourInfosClient(state.partie.joueurDeux);
            } else {
                state.partie.enCours = false;
                state.partie.debut = 0;
                state.partie.positions = [];
                state.partie.pairesTrouvees = 0;
                state.partie.joueurUn = null;
                state.partie.joueurCourant = 0;
                io.emit('afficherJeu', state.partie);
            }
        }
        if(state.partie.joueurDeux!=null && data === state.partie.joueurDeux.pseudo){
            if(state.partie.enCours && state.partie.pairesTrouvees >0){
                state.partie.joueurCourant === 1;
                io.emit('partieGagneeParForfait', [1, state.partie.joueurUn, state.partie.joueurDeux]);
                state.partie.joueurUn.vainqueur = true;
                state.partie.joueurDeux.vainqueur = false;
                state.partie.joueurDeux.pairesGagnees = 0;
                state.partie.fin = Date.now();
                state.mettreAJourInfosClient(state.partie.joueurUn);
                state.mettreAJourInfosClient(state.partie.joueurDeux);
            } else {
                state.partie.enCours = false;
                state.partie.debut = 0;
                state.partie.positions = [];
                state.partie.pairesTrouvees = 0;
                state.partie.joueurDeux = null;
                state.partie.joueurCourant = 0;
                io.emit('afficherJeu', state.partie);
            }
        }
    });
})

/////////////// SERVEUR HTTP EN ECOUTE ///////////////
server.listen(port, function () {
    console.log('En écoute');
});


