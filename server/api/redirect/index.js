(function(){

    var express = require('express');
    var router = express.Router();
    
    var redirect = function(req, res) {
        var url = req.url.substring(1);
        console.log(url);
        return res.redirect(url);
    };
    
    router.get('/*', redirect);
    
    module.exports = router;
    
}());
