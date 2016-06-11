(function(){
    var moment     = require("moment")
    var Data       = require("./data.model");
    var UpdateInfo = require("./info.model");
    var sendgrid   = require('sendgrid')(process.env.SENDGRID_APIKEY);
    
    function GetDataForUser(user, cb) {
        Data.find({ user: user, fiscal: process.env.CURRENT_FISCAL }, { user:0, fiscal:0, _id: 0, __v: 0 }).sort("date").lean().exec(function(err, data) {
            if (data && data.length > 0) {
                var latest = data[data.length - 1].date.getTime();
                data.forEach(d => {
                    d.current = (d.date.getTime() == latest) ? 1 : 0;
                });
            }
            cb(data);
        });
    }
  
    function SendMail(user, msg) {
        var payload   = {
            to      : user + "@" + process.env.USER_EMAIL_DOMAIN,
            from    : process.env.EMAIL_SENT_FROM,
            subject : 'myMIC',
            html    : msg
        };
        
        sendgrid.send(payload, function(err, json) {
            if (err) { console.error(err); }
        });
    }
  
    module.exports.getcurrentdata = function(req, res) {
        var email = req.user.preferred_username;
        if (!email.endsWith(process.env.USER_EMAIL_DOMAIN)) return res.json({});
        var user = email.substr(0, email.indexOf("@"));
        
        UpdateInfo.findOne({ user: user }, function(err, info) {
            GetDataForUser(user, function(data) {
                res.json({
                    lastupdated: info.when,
                    data: data
                });
            });
        });
    }
  
    module.exports.getdata = function(req, res) {
        var user = req.params.user;
        var quarter = req.query.quarter;
        var full = req.query.full;
        
        if (!quarter) {
            var month = moment().month();
            if (month < 3) quarter = "Q3";
            else if (month < 6) quarter = "Q4";
            else if (month < 9) quarter = "Q1";
            else quarter = "Q2";
        }

        if (full) {
            GetDataForUser(user, function(data) {
                return res.json(data);
            });
        } else {
            var search = { user: user, fiscal: process.env.CURRENT_FISCAL, quarter: quarter };
            Data.findOne(search, { user:0, fiscal:0, _id: 0, __v: 0 }).sort("-date").exec(function(err, data) {
                return res.json(data);
            });
        }
    };
    
    module.exports.putdata = function(req, res) {
        var user = req.params.user;
        
        console.log("record data for user " + user);

        var m = moment.utc(req.body.date, "DD/MM/YYYY");
        if (!m.isValid()) return res.status(400).send("invalid date");
        req.body.date = m.toDate();
        
        Data.findOne({ user: user, fiscal: req.body.fiscal, quarter: req.body.quarter, date: req.body.date }, function(err, doc) {
            if (doc) {
                console.log("already exists");
                res.json({ already: true });
            } else {
                Data.findOne({ user: user, fiscal: req.body.fiscal, quarter: req.body.quarter }).sort("-date").exec(function(err, doc) {
                    if (doc) {
                        var changed = false;
                        var msg = "Something has changed for " + req.body.quarter + ".<br />\r\n";
                        Object.keys(req.body).forEach(k => {
                            if (k.toLowerCase().indexOf("target") >= 0) {
                                if (doc[k] != req.body[k]) {
                                    changed = true;
                                    msg += k + " is now " + req.body[k] + ". It was " + doc[k] + ".<br />\r\n";
                                }
                            }
                        });
                        if (changed) {
                            SendMail(user, msg);
                        }
                    }
                   
                    var data = new Data({ user: user });
                    Object.keys(req.body).forEach(k => {
                        data[k] = req.body[k];
                    });
                    
                    data.save(function(err, doc){
                        if (err) console.log(err);
                        UpdateInfo.findOneAndUpdate({ user: user }, { when: Date.now() }, { upsert: true }, function() {
                            res.json({ done: true }); 
                        })
                    }); 
                });
            }
        });
    };
}());
