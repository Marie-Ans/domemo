// FONCTION QUI RETOURNE UN NB ALEATOIRE INCLUS DANS UN INTERVALLE DONNE
module.exports.getRandomInt = function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
};

/// FONCTIONS POUR MISE A JOUR DE DUREE DE JEU
function heureVersMillisecondes(h,m,s){
    return ((h*3600000) + (m*60000) + (s*1000));
};

function millisecondesVersHeure(ms){

    //Millisecondes : division en secondes entieres et reste des ms
    var resteMs = ms%1000;
    var temp = parseInt(ms/1000);

    //Minutes : division en minutes entieres et reste des secondes
    var sec = temp%60;
    temp = parseInt(temp/60);

    //Heures : division en heures entieres et reste des minutes
    var min = temp%60;
    var hrs = parseInt(temp/60);

    if (resteMs >= 500){
        sec+=1;
    }
    return {heures: hrs, minutes: min, secondes: sec}
};

module.exports.mettreAJourDuree = function(dureeInitialeClient, debutPartie, finPartie){
    let dureeInitialeClientMillisecondes = heureVersMillisecondes(dureeInitialeClient.heures, dureeInitialeClient.minutes, dureeInitialeClient.secondes);
    let dureePartie = finPartie - debutPartie;
    let nouvelleDuree = dureeInitialeClientMillisecondes + dureePartie;
    return millisecondesVersHeure(nouvelleDuree);
}

