(function(){
    
    let mongoose = require('mongoose');

    let dataSchema = new mongoose.Schema({ 
        user: String,
        when: Date
    })
        
    module.exports = mongoose.model("MintUpdateInfo", dataSchema);
    
}());
