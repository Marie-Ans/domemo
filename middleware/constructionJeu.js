// Appel du fichier lib.js (fichier des fonctions utilitaires)
const lib = require('./lib');


// Tableau contenant les chemins vers les images des dominos.
const src_dominos = ['/img/dominos/0_0.png', '/img/dominos/1_1.png', '/img/dominos/2_2.png', '/img/dominos/3_3.png', '/img/dominos/4_4.png', '/img/dominos/5_5.png', '/img/dominos/6_6.png', '/img/dominos/0_6.png', '/img/dominos/6_0.png'];


/** Fonction constructeur d'un domino
 * 
 * @param {string} image du domino
 * @param {string} ligne (le domino est sur la ligne du damier)
 * @param {number} colonne (le domino est sur la colonne du damier)
 * @param {number} etat (0 : mystère, 1:affiché, 2:trouvé)
 */
const Domino = function(src, ligne, colonne, etat){
    this.src = src,
    this.ligne = ligne,
    this.colonne = colonne,
    this.etat = etat
}

/** Fonction qui, pour chaque élément stocké dans src_dominos, retourne un indice entre 1 et 18 inclus. Chaque indice permettra de déterminer des coordonnnées (ligne, colonne)
 * 
 * @param {array} tableau qui stocke les positions des dominos
 */
function donnePositionDomino(tableau){
    // pour partie à 10 dominos : 
    // var nombreAleatoire = lib.getRandomInt(1, 11);
    var nombreAleatoire = lib.getRandomInt(1, 19);
    if(tableau.indexOf(nombreAleatoire)===-1){
        tableau.push(nombreAleatoire);
        return nombreAleatoire;
    } else {
        return donnePositionDomino(tableau);
    }
};


/** Fonction qui construit un domino à partir d'un chemin de fichier et d'un indice de positionement.
 * 
 * @param {string} chemin vers l'image du domino
 * @param {number} indice permettant de déterminer les coordonnées du domino
 */
function construitDomino(src,indice){
    var colonne = indice%6;
    var ligne='';
    if(indice/6 <= 1){
        ligne='Une';
    } else {
        if (indice/6 <= 2){
            ligne='Deux'
        } else {
            ligne='Trois';
        }
    }
    return new Domino(src, ligne, colonne, 0);
};

/** Fonction qui retourne un tableau de tous les dominos, avec une position aléatoire et un état initialisé à 0(etat mystère = caché).
 * 
 */
module.exports.initialiserPositions = function(){
    let stockPositions = []; // on stocke les nombres tirés aléatoirement pour ne pas les réattribuer
    let positions = []; // le tableau final des positions de chaque domino
    let src; // le chemin vers l'image du domino
    let positionUne; // la position Une pour une image de domino
    let positionDeux; // la position Deux pour la même image de domino
    let dominoUn; // la construction du domino Un à partir d'une image et de sa position
    let dominoDeux; // la construction du domino Deux à partir de la même image et de sa position

    for(var i=0;i<src_dominos.length;i++){
        src = src_dominos[i];
        positionUne = donnePositionDomino(stockPositions);
        positionDeux = donnePositionDomino(stockPositions);
        dominoUn = construitDomino(src, positionUne);
        dominoDeux = construitDomino(src, positionDeux);
        positions.push(dominoUn);
        positions.push(dominoDeux);
    }
    return positions;
};


///////////////////  POUR UNE PARTIE A 10 DOMINOS //////////////////////////

// const src_dominos = ['/img/dominos/1_1.png', '/img/dominos/2_2.png', '/img/dominos/3_3.png', '/img/dominos/4_4.png', '/img/dominos/5_5.png'];

// function construitDomino(src,indice){
//     var colonne = indice%5;
//     var ligne='';
//     if(indice/5<=1){
//         ligne='Une';
//     } else {
//         ligne='Deux';
//     }
//     return new Domino(src, ligne, colonne, 0);
// };