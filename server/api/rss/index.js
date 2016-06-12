(function(){

    var express = require('express');
    var router = express.Router();
    
    var controller = require('./rss.controller');
    
    router.get("/reddit", controller.reddit);
    
    module.exports = router;
    
}());