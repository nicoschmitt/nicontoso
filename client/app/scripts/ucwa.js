(function() {
    
    var app = angular.module('myApp');

    function reduceUrlToHost(url) {
        var parser = document.createElement("a");
        parser.href = url;
        return parser.protocol + "//" + parser.host;;
    }

    function addToAdalEndpoints(url) {
        var adalendpoints = AuthenticationContext.prototype._singletonInstance.config.endpoints;
        var endp = reduceUrlToHost(url);
        adalendpoints[endp] = endp;
    }

    app.controller('ucwaCtrl', ['$http', "$location", "adalAuthenticationService",
        function ($http, $location, adal) {
            var vm = this;
            
            vm.isAuthenticated = function() { return adal.userInfo.isAuthenticated }

            function httpError(response) {
                console.log(response.data || "Request failed");
            }

            function autoDiscover(url, callback) {
                $http.get(url).then(function(response){
                    var userurl = response.data._links.user.href;

                    addToAdalEndpoints(userurl);

                    $http.get(userurl).then(function(response){

                        if (response.data._links.hasOwnProperty("redirect")) return autoDiscover(response.data._links.redirect.href, callback);
                        
                        var appurl = response.data._links.applications.href;
                        addToAdalEndpoints(appurl);
                        callback(appurl);

                    }, httpError);

                }, httpError);
            }
        
            autoDiscover("https://webdir.online.lync.com/autodiscover/autodiscoverservice.svc/root", function(appurl) {
                var app = {
                    "UserAgent":"node",
                    "EndpointId":"94e193bc-0ef8-4ea4-bcda-a6cb0d5c91c4",
                    "Culture":"en-US",
                };
                $http.post(appurl, app).then(function(response) {
                    var meetings = reduceUrlToHost(appurl) + response.data._embedded.onlineMeetings._links.myOnlineMeetings.href;

                    var current = adal.userInfo.userName;
                    
                    var newmeeting = {
                        "attendanceAnnouncementsStatus":"Disabled",
                        "description":"",
                        "subject":"Quick Meeting",
                        "attendees":[],
                        "leaders":["sip:" + current]
                    };

                    $http.post(meetings, newmeeting).then(function(response) {
                        console.log(response.data.joinUrl);
                    }, httpError);

                }, httpError);
            });
        }
    ]);
  
}());