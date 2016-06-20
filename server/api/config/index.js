(function(){

    var express = require('express');
    var router = express.Router();
    
    var getConfig = function(req, res) {
        res.json({ 
            env: process.env.NODE_ENV,
            adalAppId: process.env.MS_APP_ID,
            micdomain: process.env.MIC_ACCESS_DOMAIN
        });
    };
    
    router.get('/', getConfig);
    
    module.exports = router;
    
}());
