var express = require("express");
var router = express.Router();

router.use(function(req,res,next) {
    next();
});

//////////////////// REQUETE SE DECONNECTER////////////////////
// GET
router.get('/', function(req, res){
    req.session.destroy(function(err){
        res.redirect('/');
    });
});

module.exports = router;