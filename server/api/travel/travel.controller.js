(function(){

    var request = require("request");
    var qs = require("querystring");
    var async = require("async");
    
    function nice(route) {
        var chemin = route.response;
        var cout = chemin.results.reduce((prev, current) => {
            prev.time += current.crossTime;
            prev.dist += current.length;
            return prev;
        }  , { time: 0, dist: 0 });
        
        return {
            name: chemin.routeName,
            time: cout.time,
            dist: cout.dist
        };
    }
    
    function parsell(ll) {
        var arr = ll.split(",").map(a => { return a.trim(); });
        return "x:" + arr[1] + " y:" + arr[0];
    }
  
    module.exports.gettravel = function(req, res) {
        var from = parsell(req.query.from);
        var to = parsell(req.query.to);

        var form = {
            "from"              : from,
            "to"                : to,
            "at"                : 0,
            "returnJSON"        : "true",
            "returnGeometries"  : "true",
            "returnInstructions": "true",
            "timeout"           : 60000,
            "nPaths"            : 3,
            "clientVersion"     : "4.0.0",
            "options"           : "AVOID_TRAILS:t,ALLOW_UTURNS:t"
        };
        
        var url = "https://www.waze.com/row-RoutingManager/routingRequest?" + qs.stringify(form);
        
        var options = {
            url: url,
            headers: {
                'Accept-Language': 'fr-FR,fr;q=0.8,en-US;q=0.6,en;q=0.4',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.22 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };
        
        request.get(options, (err, response, body) => {
             if (err) {
                 console.log(err);
                 return res.status(500).send(err);
             }
             if (response.statusCode != 200) return res.status(500).send(body);
             
             var data = JSON.parse(body);
             
             if (data.alternatives && data.alternatives.length > 0) {
                 var result = data.alternatives.map(nice);
                 res.json(result);
             }
        });
    }
  
}());
