(function(){
    
    var passport = require("passport");
    var express = require('express');
    var router = express.Router();

    var controller = require('./data.controller');
    
    router.get("/", passport.authenticate('oauth-bearer', { session: false }), controller.getcurrentdata);
    router.get('/:user', passport.authenticate('simple'), controller.getdata);
    router.put('/:user', passport.authenticate('simple'), controller.putdata);

    module.exports = router;
    
}());