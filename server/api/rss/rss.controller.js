(function(){
   
    var request = require("request");
    var xml2js = require('xml2js');
    var builder = new xml2js.Builder();
    var RSS = require('rss');
    var moment = require("moment");
    var async = require("async");
    var cheerio = require('cheerio');
    var RSSVL = require("./rssvl.model");

    module.exports.reddit = function(req, res) {
        var url = "http://www.reddit.com/.rss";
        
        request.get(url, function(err, httpResponse, body) {
            xml2js.parseString(body, function (err, rss) {
                
                rss.feed.entry.forEach(function(element) {
                    var content = element.content[0]["_"];
                    var link = content.substring(0, content.lastIndexOf("\">[link]"));
                    link = link.substring(link.lastIndexOf("href") + "href= ".length);
                    element.link[0]["$"].href = link;
                }, this);

                res.type("application/atom+xml").send(builder.buildObject(rss));
            });
        });
    }

    function findInCache(cache, type, lang) {
        for(var i = 0; i < cache.length; i++) {
            if (cache[i].doctype == type && cache[i].language == lang) return cache[i];
        }
        return null;
    }

    module.exports.vldocs = function(req, res) {

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
            site_url :   "http://" + req.headers.host + "/api/redirect/https://www.microsoft.com/en-us/licensing/product-licensing/products.aspx",
            ttl: 24*60 // 1 day
        });

        var current = moment().format("MMMMYYYY");
       
        RSSVL.find({ month: current }).lean().exec(function(err, cache) {
            if (err) { console.log(err); return res.status(500).send(err); }

            async.map(all, function(item, cb) {

                var elt = findInCache(cache, item[0], item[1]);
                if (elt != null) {
                    return cb(null, {
                        id: elt.name,
                        month: current,
                        title: elt.name + ".docx",
                        url: elt.url
                    });
                }

                var url = urltemplate.replace("{doctype}", documents[item[0]]);
                url = url.replace("{lang}", languages[item[1]]);
                
                request.get(url, function(err, httpResponse, body) {
                    if (err) return cb(err, null);

                    $ = cheerio.load(body);
                    var doc = $("#dgDocuments_ctl03_lnkTitle");
                    var name = doc.text();
                    var month = name.substring(name.lastIndexOf("(") + 1);
                    month = month.substring(0, month.indexOf(")"));
                
                    elt = new RSSVL({
                        month: current,
                        doctype: item[0],
                        language: item[1],
                        name: name,
                        url: "http://www.microsoftvolumelicensing.com/" + doc.attr("href")
                    });
                    if (month == current) {
                        elt.save(function(){
                            return cb(null, {
                                id: name,
                                month: month,
                                title: name + ".docx",
                                url: elt.url
                            });
                        });
                    } else {
                        return cb(null, {
                            id: name,
                            month: month,
                            title: name + ".docx",
                            url: elt.url
                        });
                    }
                });

            }, function(err, results) {

                results.forEach(function(doc) {
                    if (doc != null) {
                        feed.item({
                            title: doc.id,
                            description: "See <a href='https://www.microsoft.com/en-us/licensing/product-licensing/products.aspx'>here</a>",
                            url: doc.url,
                            guid: doc.id,
                            date: moment().date(1).toDate(),
                            enclosure: {
                                url: doc.url,
                                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            }
                        });
                    }
                }, this);

                res.type("application/rss+xml").send(feed.xml());
            });
            
        });

    }
  
}());
