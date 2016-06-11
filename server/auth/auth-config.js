
(function(){
    
    module.exports.register = function(app) {

        var passport = require('passport');
        var OIDCBearerStrategy = require('passport-azure-ad').BearerStrategy;
        var SimpleStrategy = require('./passport-simple').Strategy;

        app.use(passport.initialize());
        passport.use(new SimpleStrategy());
        passport.use(new OIDCBearerStrategy({
            "identityMetadata": "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
            "audience": process.env.MS_APP_ID,
            "validateIssuer": false,
            "loggingLevel": "error"
        }, function (token, done) {
            return done(null, token, null);
        }));
    }

}());
