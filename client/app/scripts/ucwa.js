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
            vm.loading = true;
            vm.message = "";
            vm.joinUrl = "";
            
            vm.isAuthenticated = function() { return adal.userInfo.isAuthenticated }

            function httpError(response) {
                console.log(response.data || "Request failed");
                vm.message = response.data || "Request failed";
                vm.loading = false;
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
        
            vm.message = "autodiscover...";
            autoDiscover("https://webdir.online.lync.com/autodiscover/autodiscoverservice.svc/root", function(appurl) {
                vm.message = "register app...";

                var app = {
                    "UserAgent":"node",
                    "EndpointId":"94e193bc-0ef8-4ea4-bcda-a6cb0d5c91c4",
                    "Culture":"en-US",
                };

                $http.post(appurl, app).then(function(response) {
                    vm.message = "create meeting...";

                    var meetings = reduceUrlToHost(appurl) + response.data._embedded.onlineMeetings._links.myOnlineMeetings.href;

                    var newmeeting = {
                        "attendanceAnnouncementsStatus": "Disabled",
                        "description": "",
                        "subject": "Quick Meeting",
                        "attendees": [],
                        "leaders": ["sip:" + adal.userInfo.userName]
                    };

                    $http.post(meetings, newmeeting).then(function(response) {
                        vm.message = "";
                        vm.loading = false;

                        console.log(response.data);
                        vm.joinUrl = response.data.joinUrl;
                    }, httpError);

                }, httpError);
            });
        }
    ]);
  
}());