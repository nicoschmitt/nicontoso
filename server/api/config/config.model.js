(function(){
    
    var mongoose = require('mongoose');

    var dataSchema = new mongoose.Schema({ 
        micdomain: String
    })
        
    module.exports = mongoose.model("Config", dataSchema);
    
}());
