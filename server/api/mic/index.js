(function(){
    
    var passport = require("passport");
    var express = require('express');
    var router = express.Router();

    var controller = require('./data.controller');
    
    router.get("/", passport.authenticate('oauth-bearer', { session: false }), controller.getcurrentdata);
    router.get('/testemail', passport.authenticate('simple'), controller.testemail);
    router.put('/:user', passport.authenticate('simple'), controller.putdata);
    router.get('/:user', passport.authenticate('simple'), controller.getdata);

    module.exports = router;
    
}());