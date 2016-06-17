(function(){
    
    var mongoose = require('mongoose');

    var dataSchema = new mongoose.Schema({ 
        month: String,
        doctype: String,
        language: String,
        name: String,
        url: String
    })
        
    module.exports = mongoose.model("RSSVL", dataSchema);
    
}());
