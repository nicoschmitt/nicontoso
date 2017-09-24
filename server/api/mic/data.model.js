(function(){
    
    let mongoose = require('mongoose');
    let shortid = require("shortid");

    let oldDataSchema = new mongoose.Schema({ 
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
        UsageActuals: Number,
        UsageTogo: Number,

        EMSUsage: Number,
        EMSUsageTarget: Number,
        EMSUsageActuals: Number,
        EMSUsageTogo: Number
        
        // CRM: Number,
        // CRMTarget: Number,
        
        // Voice: Number,
        // VoiceTarget: Number
    });

    let dataSchema = new mongoose.Schema({
        _id: {
            type: String,
            unique: true,
            'default': shortid.generate
        },
        
        user: String,
        date: Date,
        fiscal: String,
        quarter: String,

        targets: mongoose.Schema.Types.Mixed,
        actuals: mongoose.Schema.Types.Mixed,
    });
        
    module.exports = {
        old: mongoose.model("MicData", oldDataSchema),
        current: mongoose.model("MintData", dataSchema),
    };
    
}());
