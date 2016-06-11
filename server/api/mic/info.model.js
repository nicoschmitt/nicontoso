(function(){
    
    var mongoose = require('mongoose');

    var dataSchema = new mongoose.Schema({ 
        user: String,
        when: Date
    })
        
    var UpdateInfo = mongoose.model("UpdateInfo", dataSchema);
    module.exports = UpdateInfo;
    
}());
