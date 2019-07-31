const express = require("express");
const router = express.Router();
const passwordHash = require('password-hash');

const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://Marie:_Back1503@divjs10ma-csygg.gcp.mongodb.net/test?retryWrites=true&w=majority";

const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const state = require('../middleware/state');


router.use(function(req,res,next) {
    datas = req.app.locals;
    req.app.locals = {};
    next();
});


/*Accès aux formulaires de connexion et de création de compte. 
Par défaut, formulaire de connexion. Si l'utilisateur clique sur le lien "Créer un compte", alors une query est envoyée (req.query.q), ce qui permet de distinguer les deux actions.
*/
router.get('/', function(req, res){
    if(req.session && req.session.client){
        datas.title = 'Erreur 401';
        datas.msgIndex = 'Accès interdit : un utilisateur ('+req.session.client.pseudo+') est déjà connecté sur ce navigateur.';
        state.infoClients.push(req.session.client);
        state.idClients.push(req.session.client.idClient);
        res.render('401',datas);
        return;
    }
    if(req.query.r){
        res.render('create', datas);
    }
    else {
        res.render('connect', datas);
    }
});

/*Traitement des formulaires de connexion ou de création de compte.
Si req.body.create existe c'est qu'il s'agit du traitement du formulaire de création de compte. 
Si pseudo et pwd non vides, et si pseudo disponible, alors le compte est créé + retour au formulaire de connexion
Sinon, message d'erreur.

Si req.body.create n'existe pas c'est qu'il s'agit du traitement du formulaire de connexion
Si pseudo et pwd non vides et reconnus, alors création d'un identifiant de session req.session.client et accès au jeu (domemo)
Sinon, message d'erreur
*/
router.post('/', urlencodedParser, function(req, res){
    if(req.body.create){
        ///TRAITEMENT DU FORMULAIRE DE CREATION DE COMPTE
        if(req.body.pseudo === '' || req.body.pwd === ''){
            datas.msg = {text:'Veuillez saisir un identifiant et un mot de passe',class:'error'};
            res.render('create', datas);
            return;
        }
        if (req.body.pwd.length<8){
            datas.msg = {text:'Votre mot de passe doit contenir au moins 8 caractères',class:'error'};
            res.render('create', datas);
            return;
        }
    
        MongoClient.connect(url, { useNewUrlParser: true },function(err, client) {
            if (err) {
                datas.msg = {text:'Problème de connexion à la base de données - Veuillez réessayer un peu plus tard',class:'error'};
                res.render('create', datas);
                return;
            }
        
            var maDb = client.db('domemo');
        
            var maCollection = maDb.collection('joueurs');
    
            var regex = new RegExp("\^"+req.body.pseudo+"\$","i");
    
            maCollection.findOne({pseudo: regex}, function(err, result){
                if(result === null){
                    maCollection.insertOne({
                        pseudo: req.body.pseudo,
                        pwd: passwordHash.generate(req.body.pwd),
                        scores:{
                            parties_gagnees:0,
                            parties_perdues:0,
                            paires_gagnees: 0
                        },
                        duree: {
                            heures: 0,
                            minutes: 0,
                            secondes: 0,
                        }
                    }, function(err, result){
                        if (err){
                            datas.msg = {text:'Echec de la création de compte, veuillez réessayer dans quelques minutes', class:'error'};
                            res.render('create', datas);
                        } else {
                            datas.createAccount = true;
                            datas.msg = {text:'Votre compte a bien été créé, vous pouvez vous connecter', class:'success'};
                            datas.pseudo = req.body.pseudo;
                            res.render('connect', datas);
                            client.close();
                        }
                    });
          
                } else {
                    datas.msg = {text:'Ce pseudo est déjà pris, veuillez en choisir un autre',class:'error'};
                    res.render('create', datas);
                }
            });
        });
    } else {
        ///TRAITEMENT DU FORMULAIRE DE CONNEXION
        if(req.body.pseudo === '' || req.body.pwd === ''){
            datas.msg = {text:'Veuillez saisir votre identifiant et votre mot de passe',class:'error'};
            res.render('connect', datas);
    
        } else {
            MongoClient.connect(url, { useNewUrlParser: true },function(err, client) {
                if (err) {
                    datas.msg = {text:'Problème de connexion à la base de données - Veuillez réessayer un peu plus tard',class:'msgerror'};
                    res.render('connect', datas);
                  return;
                }
            
                var maDb = client.db('domemo');
            
                var maCollection = maDb.collection('joueurs');
        
                maCollection.findOne({pseudo: req.body.pseudo}, function(err, result){
                    client.close();
                    if(err) throw err;
    
                    if(result  === null){
                        datas.msg = {text:'Cet identifiant n\'existe pas',class:'error'};
                        res.render('connect', datas);
    
                    } else {
                        if(!(passwordHash.verify(req.body.pwd, result.pwd))){
                            datas.msg = {text:'Erreur de mot de passe',class:'error'};
                            res.render('connect', datas);
                            return; 
                        }
                        if(state.idClients.indexOf((result._id).toString()) != -1){
                            datas.msg = {text:'Joueur déjà connecté!',class:'error'};
                            res.render('connect', datas);
                        } else {
                            req.session.client = {
                                idClient: (result._id).toString(),
                                pseudo : result.pseudo,
                                avatar : 'img/avatars/'+req.body.avatar+'.png',
                                joueur: 0,
                                scores: result.scores,
                                duree: result.duree
                            };
                            state.idClients.push((result._id).toString());
                            state.infoClients.push((req.session.client));
                            res.redirect('/domemo');  
                        }
                    }
                });
        
              });
        }
    }


});




// Autres routes
router.use("/domemo", require("./domemo"));
router.use("/disconnect", require("./disconnect"));

module.exports = router;