(function(){
   
    console.log("debug");
    require('dotenv').config({silent: true});

    function testrss() {

        var RSS = require('rss');
        var moment = require("moment");
        var async = require("async");
        var request = require("request");
        var cheerio = require('cheerio');

        var urltemplate = "http://www.microsoftvolumelicensing.com/DocumentSearch.aspx?Mode=3&DocumentTypeId={doctype}&Language={lang}";

        var documents = {
            SLA: 37,
            OST: 46,
            PT: 53
        };

        var languages = {
            English: 1,
            French: 9
        };

        var all = [];
        for (var d in documents) {
            for (var l in languages) {
                all.push([ d, l ]);
            }
        }
    
        var feed = new RSS({
            title:       'Volume licensing',
            description: 'VL documents',
            site_url :   'https://www.microsoft.com/en-us/licensing/product-licensing/products.aspx',
            ttl: 24*60 // 1 day
        });

        async.map(all, function(item, cb) {

            var url = urltemplate.replace("{doctype}", documents[item[0]]);
            url = url.replace("{lang}", languages[item[1]]);
            
            request.get(url, function(err, httpResponse, body) {
                if (err) return cb(err, null);

                $ = cheerio.load(body);
                var doc = $("#dgDocuments_ctl03_lnkTitle");
                var name = doc.text();
                var month = name.substring(name.lastIndexOf("(") + 1);
                month = month.substring(0, month.indexOf(")"));
                console.log(month);

                cb(null, {
                    id: name,
                    month: month,
                    title: name + ".docx",
                    url: "http://www.microsoftvolumelicensing.com/" + doc.attr("href")
                });
            });

        }, function(err, results) {

            results.forEach(function(doc) {
                if (doc != null) {
                    feed.item({
                        title: doc.id,
                        description: "See <a href='https://www.microsoft.com/en-us/licensing/product-licensing/products.aspx'>here</a>",
                        url: "https://www.microsoft.com/en-us/licensing/product-licensing/products.aspx",
                        guid: doc.id,
                        date: moment().date(1).toDate(),
                        enclosure: {
                            url: doc.url,
                            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        }
                    });
                }
            }, this);

            console.log(feed.xml({indent: true}));

        });

    }
  
    function testconfig() {

        var mongoose = require("mongoose");
        mongoose.connect(process.env.MONGO_URI);

        var Config = require("./server/api/config/config.model");

        Config.findOne({ }, { __v:0, _id:0 }).lean().exec(function(err, config) {
            if(err) console.log(err);
            console.log("ok");
            console.log(config);
        });

    }

    function testEMail() {
        var sendgrid   = require('sendgrid');

        var msg = "<div style='font-size:11.0pt;font-family:\"Calibri\",sans-serif;'>Hello<br />";
        msg += "bla bla</div>"

        var sender = sendgrid.SendGrid(process.env.SENDGRID_APIKEY);
        var helper = sendgrid.mail;

        mail = new helper.Mail(
            new helper.Email(process.env.EMAIL_SENT_FROM), 
            "myMIC", 
            new helper.Email("nicolass@microsoft.com"),  
            new helper.Content("text/html", msg)
        );

        var emptyRequest = require('sendgrid-rest').request;
        var requestPost = sender.emptyRequest();
        requestPost.method = 'POST';
        requestPost.path = '/v3/mail/send';
        requestPost.body = mail.toJSON();
        sender.API(requestPost, function (response) { 
            console.log(response);
        });
    }

    function test() {
        var entities = require("entities");

        var url = "https://i.reddituploads.com/7af8856a278c40259128c182ce37666e?fit=max&amp;h=1536&amp;w=1536&amp;s=c88d06fa12bd4cc61daf78d48d9c7426";
        url = entities.decodeHTML(url);
        console.log(url);
    }

    test();

}());