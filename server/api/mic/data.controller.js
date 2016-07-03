(function(){
    var moment     = require("moment");
    var MicData    = require("./data.model");
    var UpdateInfo = require("./info.model");
    var sendgrid   = require('sendgrid');

    function GetDataForUser(user, cb) {
        MicData.find({ user: user, fiscal: process.env.CURRENT_FISCAL }, { user:0, fiscal:0, _id: 0, __v: 0 }).sort("date").lean().exec(function(err, data) {
            if (data && data.length > 0) {
                var latest = data[data.length - 1].date.getTime();
                data.forEach(d => {
                    d.current = (d.date.getTime() == latest) ? 1 : 0;
                });
            }
            cb(data);
        });
    }
  
    function SendMail(user, msg, host) {
        var sender = sendgrid.SendGrid(process.env.SENDGRID_APIKEY);
        var helper = sendgrid.mail;

        var fullmsg = "<div style='font-size:11.0pt;font-family:\"Calibri\",sans-serif;'>";
        fullmsg += msg;
        fullmsg += "<p>Go to <a href='https://" + host + "/#Mic'>MyMic</a></p></div>";

        mail = new helper.Mail(
            new helper.Email(process.env.EMAIL_SENT_FROM), 
            "myMIC", 
            new helper.Email(user + "@" + process.env.MIC_ACCESS_DOMAIN),  
            new helper.Content("text/html", fullmsg)
        );

        var emptyRequest = require('sendgrid-rest').request;
        var requestPost = sender.emptyRequest();
        requestPost.method = 'POST';
        requestPost.path = '/v3/mail/send';
        requestPost.body = mail.toJSON();
        sender.API(requestPost, function (response) { 
            //console.log(response);
        });
    }
  
    module.exports.getcurrentdata = function(req, res) {
        var email = req.user.preferred_username;
        if (!email.endsWith(process.env.MIC_ACCESS_DOMAIN)) return res.json({});
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
            else if (month < 7) quarter = "Q4"; // July is like Q4
            else if (month < 9) quarter = "Q1";
            else quarter = "Q2";
        }

        if (full) {
            GetDataForUser(user, function(data) {
                return res.json(data);
            });
        } else {
            var search = { user: user, fiscal: process.env.CURRENT_FISCAL, quarter: quarter };
            MicData.findOne(search, { user:0, fiscal:0, _id: 0, __v: 0 }).sort("-date").exec(function(err, data) {
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
        
        MicData.findOne({ user: user, fiscal: req.body.fiscal, quarter: req.body.quarter, date: req.body.date }, function(err, doc) {
            if (doc) {
                console.log("already exists");
                res.json({ already: true });
            } else {
                MicData.findOne({ user: user, fiscal: req.body.fiscal, quarter: req.body.quarter }).sort("-date").exec(function(err, doc) {
                    if (doc) {
                        // Alert if quota changed
                        var quotaChanged = false;
                        var msg = "Something has changed for " + req.body.quarter + ".<br />\r\n";
                        Object.keys(req.body).forEach(k => {
                            if (k.toLowerCase().indexOf("target") >= 0) {
                                if (doc[k] != req.body[k]) {
                                    quotaChanged = true;
                                    msg += k + " is now " + req.body[k] + ". It was " + doc[k] + ".<br />\r\n";
                                }
                            }
                        });
                        if (quotaChanged) {
                            SendMail(user, msg, req.headers.host);
                        }

                        // Alert if +5% in PG1 or PG2
                        if (req.body["PG1"] - doc["PG1"] >= 5 || req.body["PG2"] - doc["PG2"] >= 5) {
                            msg = "Big raised in attainment: <br />\r\n";
                            msg += "  PG1 is now " + req.body["PG1"] + ", was " + doc["PG1"] + "<br />\r\n";
                            msg += "  PG2 is now " + req.body["PG2"] + ", was " + doc["PG2"] + "<br />\r\n";

                            SendMail(user, msg, req.headers.host);
                        }
                    }
                   
                    var data = new MicData({ user: user });
                    Object.keys(req.body).forEach(k => {
                        data[k] = req.body[k];
                    });
                    
                    data.save(function(err, doc){
                        if (err) { console.log(err); res.status(500).send(err); }
                        else {
                            UpdateInfo.findOneAndUpdate({ user: user }, { user: user, when: Date.now() }, { upsert: true }, function(err, doc) {
                                if (err) { console.log(err); res.status(500).send(err); }
                                else { res.json({ done: true }); }
                            });
                        }
                    }); 
                });
            }
        });
    };
}());
