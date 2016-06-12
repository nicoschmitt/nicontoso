(function(){
   
   var request = require("request");
   var xml2js = require('xml2js');
   var builder = new xml2js.Builder();

    module.exports.reddit = function(req, res) {
        var url = "http://www.reddit.com/.rss";
        
        request.get(url, function(err, httpResponse, body) {
            //console.log(body);
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
  
}());
