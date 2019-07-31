const lib = require('./lib');
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://Marie:jeuback2019@divjs10ma-csygg.gcp.mongodb.net/test?retryWrites=true&w=majority";


module.exports = {
  idClients : [], // les id des clients connectés
  infoClients : [], // toutes les infos de chaque client connecté.
  pseudoClientSortant : null, // le pseudo du client qui se déconnecte ou ferme son navigateur
  partie : {
    enCours : false, // partie non démarrée = false, true sinon
    debut : 0, //indice temporel début de partie en millisecondes
    fin: 0, //indice temporel fin de partie en millisecondes
    positions : [], // positions aléatoires des dominos dans le jeu
    joueurUn : null, // idClient, pseudo, avatar, pairesGagnees,ndNominos, vainqueur : false
    joueurDeux : null, // idClient, pseudo, avatar, pairesGagnees, ndNominos, scores, duree, vainqueur: false
    joueurCourant : 0, // 0 pas de joueurCourant / 1 joueurUn / 2 joueurDeux
    dominoUnCourant : null, // le premier domino cliqué sur un tour
    dominoDeuxCourant : null, // le second domino cliqué sur un tour
    pairesTrouvees : 0 // Si = total = 5 = fin de partie
  },
  retourneIndiceClient : function(pseudo){
    for (let i = 0; i < this.infoClients.length; i++) {
      if (this.infoClients[i].pseudo === pseudo) {
        return i;
      }
    }
  },
  retourneIndiceIdClient : function(pseudo){
    let indiceClient = this.retourneIndiceClient(pseudo);
    if(indiceClient){
      let idClient = this.infoClients[indiceClient].idClient;
      return this.idClients.indexOf(idClient);
    }
  },
  reinitialiserJeu : function(){
    this.partie.enCours = false;
    this.partie.debut = 0;
    this.partie.fin = 0;
    this.partie.positions = [];
    this.partie.joueurUn = null;
    this.partie.joueurDeux = null;
    this.partie.joueurCourant = 0;
    this.partie.dominoUnCourant = null;
    this.partie.dominoDeuxCourant = null;
    this.partie.pairesTrouvees = 0;
    for(let i=0;i<this.infoClients.length;i++){
      this.infoClients[i].joueur === 0;
    }
  },
  changeEtatDomino : function(domino,etat){
    for(var i=0;i<this.partie.positions.length;i++){
      if(this.partie.positions[i].ligne === domino.ligne && this.partie.positions[i].colonne === domino.colonne){
          this.partie.positions[i].etat = etat;
      }
    }
  },
  ajoutePaireJoueurCourant : function(){
    if(this.partie.joueurCourant === 1){
      this.partie.joueurUn.pairesGagnees++;
    } else {
      this.partie.joueurDeux.pairesGagnees++;
    }
  },
  infosJoueurCourant : function(){
    if(this.partie.joueurCourant === 1){
      return this.partie.joueurUn;
    } else {
      return this.partie.joueurDeux;
    }
  },
  changeJoueurCourant : function(){
    if(this.partie.joueurCourant === 1){
      this.partie.joueurUn.joueurCourant = false;
      this.partie.joueurDeux.joueurCourant = true;
      this.partie.joueurCourant = 2;
    } else {
      this.partie.joueurDeux.joueurCourant = false;
      this.partie.joueurUn.joueurCourant = true;
      this.partie.joueurCourant = 1;
    }
  },
  mettreAJourInfosClient : function(joueur){
    for(let i=0;i<this.infoClients.length;i++){
      if(this.infoClients[i].pseudo === joueur.pseudo){
        this.infoClients[i].duree = lib.mettreAJourDuree(this.infoClients[i].duree, this.partie.debut, this.partie.fin);
        this.infoClients[i].scores.paires_gagnees += joueur.pairesGagnees;
        if(joueur.vainqueur){
          this.infoClients[i].scores.parties_gagnees++;
        } else {
          this.infoClients[i].scores.parties_perdues++;
        }
        MongoClient.connect(url, { useNewUrlParser: true },function(err, client) {
          var maCollection = client.db('domemo').collection('joueurs');
          maCollection.updateOne(
            {pseudo: joueur.pseudo},
            {$set: {"duree.heures": joueur.duree.heures, "duree.minutes": joueur.duree.minutes, "duree.secondes": joueur.duree.secondes, "scores.parties_gagnees": joueur.scores.parties_gagnees, "scores.parties_perdues": joueur.scores.parties_perdues, "scores.paires_gagnees": joueur.scores.paires_gagnees}},
            function(err, result){
                client.close();
            }
          )    
        });
      }
    }
  }
};