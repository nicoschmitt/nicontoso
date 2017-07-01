(function(){
    let request = require("request");
    let xml2js = require('xml2js');
    let builder = new xml2js.Builder();
    let RSS = require('rss');
    let moment = require("moment");
    let async = require("async");
    let RSSVL = require("./rssvl.model");
    let entities = require("entities");

    module.exports.reddit = function(req, res) {
        let url = "http://www.reddit.com/.rss";
        
        request.get(url, function(err, httpResponse, body) {
            xml2js.parseString(body, function (err, rss) {
                
                rss.feed.entry.forEach(function(element) {
                    let content = element.content[0]["_"];
                    let link = content.substring(0, content.lastIndexOf("\">[link]"));
                    link = link.substring(link.lastIndexOf("href") + "href= ".length);
                    link = entities.decodeHTML(link);
                    element.link[0]["$"].href = link;
                }, this);

                res.header('Cache-Control', 'public, max-age=360');
                res.removeHeader("Expires");
                res.removeHeader("Pragma");
                res.type("application/atom+xml").send(builder.buildObject(rss));
            });
        });
    }

    var vlcache = { when: null, data: [] };
    function getVLCache(current, callback) {
        if (vlcache.data.length > 0 && vlcache.when.isAfter(moment().subtract(1, "days"))) {
            //console.log("local cache");
            callback(null, vlcache.data);
        } else {
            RSSVL.find({ month: current }).lean().exec(function(err, cache) {
                if (!err) { 
                    if (cache != null) {
                        //console.log("remote cache");
                        vlcache = {
                            when: moment(),
                            data: cache
                        };
                    } else {
                        //console.log("no cache");
                    }
                }
                callback(err, cache);
            });
        }
    }

    function findInVLCache(cache, type, lang) {
        for(let i = 0; i < cache.length; i++) {
            if (cache[i].doctype == type && cache[i].language == lang) return cache[i];
        }
        return null;
    }

    module.exports.vldocs = function(req, res) {
        let url = 'http://www.microsoftvolumelicensing.com/DocumentSearchService.asmx/GetSearchResults';

        let documents = {
            SLA: 37,
            OST: 46,
            PT: 53
        };

        let languages = {
            English: 1,
            French: 9
        };

        let all = [];
        for (let d in documents) {
            for (let l in languages) {
                all.push({ doc: d, lang: l });
            }
        }
    
        let feed = new RSS({
            title:       'Volume licensing',
            description: 'VL documents',
            site_url :   "http://" + req.headers.host + "/api/redirect/https://www.microsoft.com/en-us/licensing/product-licensing/products.aspx",
            ttl: 24*60 // 1 day
        });

        let current = moment().format("MMMMYYYY");
       
        getVLCache(current, function(err, cache) {
            if (err) { console.log(err); return res.status(500).send(err); }

            async.map(all, function(item, cb) {

                let elt = findInVLCache(cache, item.doc, item.lang);
                if (elt != null) {
                    return cb(null, {
                        id: elt.name,
                        month: current,
                        title: elt.name + ".docx",
                        url: elt.url
                    });
                }

                let json = {
                    filterValues: [
                        {"Key": "@DocumentTypeID", "Value": documents[item.doc].toString()},
                        {"Key": "@LanguageID", "Value": languages[item.lang].toString()},
                        {"Key": "@RegionID", "Value": 0},
                        {"Key": "@SectorID", "Value": 0},
                    ],
                };

                request.post({url: url, json: true, body: json}, function(err, httpResponse, body) {
                    if (err) return cb(err, null);

                    let results = JSON.parse(body.d).Root.Document;
                    let filename = results[0]['@FileName'];
                    let title = results[0]['@Title'];
                    let docId = results[0]['@DocumentID'];

                    var month = title.substring(title.lastIndexOf("(") + 1);
                    month = month.substring(0, month.indexOf(")"));
                
                    elt = new RSSVL({
                        month: current,
                        doctype: item.doc,
                        language: item.lang,
                        name: title,
                        url: 'http://www.microsoftvolumelicensing.com/Downloader.aspx?DocumentId=' + docId,
                    });
                    if (month == current) {
                        elt.save(function(){
                            return cb(null, {
                                id: filename,
                                month: month,
                                title: filename,
                                url: elt.url
                            });
                        });
                    } else {
                        return cb(null, {
                            id: filename,
                            month: month,
                            title: filename,
                            url: elt.url
                        });
                    }
                });

            }, function(err, results) {

                results.forEach(function(doc) {
                    if (doc != null) {
                        feed.item({
                            title: doc.title,
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

                res.header('Cache-Control', 'public, max-age=86400');
                res.removeHeader("Expires");
                res.removeHeader("Pragma");
                res.type("application/rss+xml").send(feed.xml({ indent: true }));
            });
        });
    }
}());
