var express = require("express");
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://Marie:_Back1503@divjs10ma-csygg.gcp.mongodb.net/test?retryWrites=true&w=majority";

var state = require('../middleware/state');

// Stockage des données dans req.app.locals pour l'affichage (pug) : clients connectés, req.session.client, joueurUn et joueurDeux

router.use(function(req,res,next) {
    datas = req.app.locals;
    req.app.locals = {};
    datas.clientsConnectes = state.infoClients;
    datas.title='Domemo';
    if(req.session.client){
        datas.session = req.session.client;
    }
    if(state.partie.joueurUn!==null){
        datas.joueurUn = state.partie.joueurUn;
    }
    if(state.partie.joueurDeux!==null){
        datas.joueurDeux = state.partie.joueurDeux;
    }
    next();
});

/**
 Page de jeu : récupération de tous les scores en base de données + render du fichier pug (datas contenant les scores + toutes les données stockées précédemment)
 */
router.get('/', function(req, res){
    
    if(req.session && req.session.client){
        MongoClient.connect(url,{useNewUrlParser: true}, function(err,client) {
            if (err) {
                datas.msg = {text:'Problème de connexion à la base de données - Veuillez réessayer un peu plus tard',class:'msgerror'};
                res.render('domemo',datas);
                return;
            }
            const db = client.db('domemo');
            const collection = db.collection('joueurs');
            collection.find().sort({"scores.parties_gagnees":-1}).toArray(function(err,results){
                client.close();
                if(results.length===0){
                    datas.msg = {text:'Pas de score pour l\'instant : aucune partie n\'a encore été jouée',class:'msginfo'};
                } else {
                    datas.scores=results;
                    res.render('domemo',datas);
                }
            });
        });
    } else {
        datas.title = 'Erreur 401';
        datas.msgDomemo = 'Accès interdit : vous devez être connecté(e).';
        res.render('401',datas);
    }
});

module.exports = router;