(function(){

    var express = require('express');
    var router = express.Router();
    
    var redirect = function(req, res) {
        return res.redirect(req.url.substring(1));
    };
    
    router.get('/*', redirect);
    
    module.exports = router;
    
}());
