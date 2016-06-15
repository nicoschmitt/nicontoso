(function(){

    var Config = require("./config.model");

    var express = require('express');
    var router = express.Router();
    
    var getConfig = function(req, res) {

        Config.findOne({ }, { __v:0, _id:0 }).lean().exec(function(err, config) {
            res.json({ 
                env: process.env.NODE_ENV,
                adalAppId: process.env.MS_APP_ID,
                micdomain: config.micdomain
            });
        });

    };
    
    router.get('/', getConfig);
    
    module.exports = router;
    
}());
