(function(){
    var express = require('express');
    var router = express.Router();

    var controller = require('./travel.controller');
    
    router.get("/", controller.gettravel);

    module.exports = router;
}());