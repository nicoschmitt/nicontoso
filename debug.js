(function(){
   
    console.log("debug");

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
  
}());