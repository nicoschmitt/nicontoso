(function(){

    var express = require('express');
    var router = express.Router();
    
    var getConfig = function(req, res) {
      res.json({ 
          env: process.env.NODE_ENV,
          adalAppId: process.env.MS_APP_ID,
          o365tenant: process.env.O365_TENANT
      });
    };
    
    router.get('/', getConfig);
    
    module.exports = router;
    
}());
