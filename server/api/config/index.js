(function(){

    var express = require('express');
    var router = express.Router();

    //

    var getVersion = function(req, res) {
        res.json({ 
            node_version: process.version
        });
    };
    
    router.get('/version', getVersion);

    //
    
    var getConfig = function(req, res) {
        res.json({ 
            env: process.env.NODE_ENV,
            adalAppId: process.env.MS_APP_ID,
            micdomain: process.env.MIC_ACCESS_DOMAIN,
            analytics: process.env.GOOGLE_ANALYTICS
        });
    };
    
    router.get('/', getConfig);

    //
    
    module.exports = router;
    
}());
