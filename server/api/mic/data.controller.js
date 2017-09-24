(function(){
    let moment     = require("moment");
    let AppData    = require("./data.model");
    let UpdateInfo = require("./info.model");
    let sendgrid   = require('sendgrid');

    function GetDataForUser(user, fiscal, cb) {
        let Data = (fiscal === 'FY17') ? AppData.old : AppData.current;
        Data.find({ user: user, fiscal: fiscal }, { user:0, fiscal:0, _id: 0, __v: 0 }).sort("date").lean().exec(function(err, data) {
            if (data && data.length > 0) {
                let latest = data[data.length - 1].date.getTime();
                data.forEach(d => {
                    d.current = (d.date.getTime() == latest) ? 1 : 0;
                });
            }
            cb(data);
        });
    }
  
    function SendMail(user, msg, host, callback) {
        let sender = sendgrid(process.env.SENDGRID_APIKEY);
        let helper = sendgrid.mail;

        if (user.indexOf("@") < 0) user += "@" + process.env.MIC_ACCESS_DOMAIN;

        let fullmsg = "<div style='font-size:11.0pt;font-family:\"Calibri\",sans-serif;'>";
        fullmsg += msg;
        fullmsg += "<p>Go to <a href='https://" + host + "/#Mic'>MyMic</a></p></div>";

        mail = new helper.Mail(
            new helper.Email(process.env.EMAIL_SENT_FROM), 
            "myMIC", 
            new helper.Email(user),  
            new helper.Content("text/html", fullmsg)
        );

        let emptyRequest = require('sendgrid-rest').request;
        let requestPost = sender.emptyRequest();
        requestPost.method = 'POST';
        requestPost.path = '/v3/mail/send';
        requestPost.body = mail.toJSON();
        sender.API(requestPost, function (err, response) { 
            if (err) { console.log("error"); console.log(err); }
            callback(err, response);
        });
    }
  
    module.exports.getcurrentdata = function(req, res) {
        let email = req.user.unique_name;
        if (!email.endsWith("@" + process.env.MIC_ACCESS_DOMAIN)) return res.json({});
        let user = email.substr(0, email.indexOf("@"));

        let fiscal = req.query.fiscal || process.env.CURRENT_FISCAL;
        
        UpdateInfo.findOne({ user: user }, function(err, info) {
            GetDataForUser(user, fiscal, function(data) {
                res.json({
                    lastupdated: info.when,
                    data: data
                });
            });
        });
    }
  
    module.exports.getdata = function(req, res) {
        let user = req.params.user;
        let quarter = req.query.quarter;
        let full = req.query.full;
        let fiscal = req.query.fiscal || process.env.CURRENT_FISCAL;
        
        if (!quarter) {
            let month = moment().month();
            if (month < 3) quarter = "Q3";
            else if (month < 7) quarter = "Q4"; // July is like Q4
            else if (month < 9) quarter = "Q1";
            else quarter = "Q2";
        }

        if (full) {
            GetDataForUser(user, fiscal, function(data) {
                return res.json(data);
            });
        } else {
            let search = { user: user, fiscal: fiscal, quarter: quarter };
            let Data = (fiscal === 'FY17') ? AppData.old : AppData.current;
            Data.findOne(search, { user:0, fiscal:0, _id: 0, __v: 0 }).sort("-date").exec(function(err, data) {
                return res.json(data);
            });
        }
    };
    
    module.exports.putdata = function(req, res) {
        let user = req.params.user;
        if (req.body.fiscal !== proces.env.CURRENT_FISCAL) return res.status(500).send('Switch to ' + proces.env.CURRENT_FISCAL);

        console.log("record data for user " + user);

        let m = moment.utc(req.body.date, "DD/MM/YYYY");
        if (!m.isValid()) return res.status(400).send("invalid date");
        req.body.date = m.toDate();
        
        let Data = (req.body.fiscal === 'FY17') ? AppData.old : AppData.current;
        Data.findOne({ user: user, fiscal: req.body.fiscal, quarter: req.body.quarter, date: req.body.date }, function(err, doc) {
            if (doc) {
                console.log("already exists");
                res.json({ already: true });
            } else {
                Data.findOne({ user: user, fiscal: req.body.fiscal, quarter: req.body.quarter }).sort("-date").exec(function(err, doc) {
                    if (doc) {
                        // Alert if quota changed
                        let quotaChanged = false;
                        let msg = `Something has changed for ${req.body.quarter}.<br />\r\n`;
                        Object.keys(req.body).forEach(k => {
                            if (k.toLowerCase().indexOf("target") >= 0) {
                                if (doc[k] != req.body[k]) {
                                    quotaChanged = true;
                                    msg += k + " is now " + req.body[k] + ". It was " + doc[k] + ".<br />\r\n";
                                }
                            }
                        });
                        if (quotaChanged) {
                            SendMail(user, msg, req.headers.host, () => {});
                        }

                        // Alert if +5% in PG1 or PG2
                        if (req.body["PG1"] - doc["PG1"] >= 5 || req.body["PG2"] - doc["PG2"] >= 5) {
                            msg = `Big raise in attainment for ${req.body.quarter}: <br />\r\n`;
                            msg += "  PG1 is now " + req.body["PG1"] + ", was " + doc["PG1"] + "<br />\r\n";
                            msg += "  PG2 is now " + req.body["PG2"] + ", was " + doc["PG2"] + "<br />\r\n";

                            SendMail(user, msg, req.headers.host, () => {});
                        }

                        // Alert if actuals decreased 
                        if (req.body["PG1"] < doc["PG1"] || req.body["PG2"] < doc["PG2"]) {
                            msg = `Attainment decrease for ${req.body.quarter}: <br />\r\n`;
                            msg += "  PG1 is now " + req.body["PG1"] + ", was " + doc["PG1"] + "<br />\r\n";
                            msg += "  PG2 is now " + req.body["PG2"] + ", was " + doc["PG2"] + "<br />\r\n";

                            SendMail(user, msg, req.headers.host, () => {});
                        }
                    }
                   
                    let data = new Data({ user: user });
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

    module.exports.testemail = function(req, res) {
        // console.log("Test email");
        // SendMail("", "Test email.", "localhost", () => {
        //     
        // }); 
        return res.json({});  
    }
}());
