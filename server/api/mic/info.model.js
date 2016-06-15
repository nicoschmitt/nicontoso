(function(){
    
    var mongoose = require('mongoose');

    var dataSchema = new mongoose.Schema({ 
        user: String,
        when: Date
    })
        
    module.exports = mongoose.model("MicUpdateInfo", dataSchema);
    
}());
