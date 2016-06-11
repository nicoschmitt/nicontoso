(function(){

    var express = require('express');
    var router = express.Router();
    
    var controller = require('./tenant.controller');
    
    router.get("/:tenant", controller.checktenant);
    
    module.exports = router;
    
}());