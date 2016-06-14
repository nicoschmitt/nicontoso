(function(){
    
    var mongoose = require('mongoose');
    var shortid = require("shortid");

    var dataSchema = new mongoose.Schema({ 
        _id: {
            type: String,
            unique: true,
            'default': shortid.generate
        },
        
        user: String,
        date: Date,
        fiscal: String,
        quarter: String,
        
        PG1: Number,
        PG1Target: Number,
        PG1Actuals: Number, 
        PG1Togo: Number,
        
        PG2: Number,
        PG2Target: Number,
        PG2Actuals: Number,
        PG2Togo: Number,
        
        Usage: Number,
        UsageTarget: Number,
        
        CRM: Number,
        CRMTarget: Number,
        
        Voice: Number,
        VoiceTarget: Number
    })
        
    module.exports = mongoose.model("MicData", dataSchema);
    
}());
