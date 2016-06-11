
(function(){

    var util = require('util');
    var Strategy = require('passport-strategy');
 
    function SimpleStrategy() {
        Strategy.call(this);
        this.name = "simple";
    }
 
    util.inherits(SimpleStrategy, Strategy);
    
    SimpleStrategy.prototype.authenticate = function(req, options) {
        var key = req.query.key;
        if (key != process.env.SECRET_KEY) {
            return this.fail("unauthorized");
        }
        
        this.pass();
    };    

    module.exports.Strategy = SimpleStrategy;

}());
