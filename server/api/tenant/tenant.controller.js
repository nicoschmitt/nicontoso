(function(){
   
   var request = require("request");
   
    module.exports.checktenant = function(req, res) {
        var url = "https://portal.office.com/CheckDomainAvailability.ajax";
      
        var form = {
            assembly: "BOX.Admin.UI, Version=16.0.0.0, Culture=neutral, PublicKeyToken=null",
            class: "Microsoft.Online.BOX.Signup.UI.SignupServerCalls",
            p0: req.params.tenant
        };
        
        request.post({ url: url, form: form }, function(err, httpResponse, body) {
            //console.log(body);
            if (body.indexOf("<response><![CDATA[1]]></response>") >= 0) {
                res.json({ taken: false }); 
            } else {
                res.json({ taken: true }); 
            }
        });
    }
  
}());
