(function() {
    
    var app = angular.module('myApp');
  
    app.controller('topNavCtrl', ["$config", "$rootScope", "$location", 'adalAuthenticationService', "$http", 
        function ($config, $rootScope, $location, adal, $http) {
            var vm = this;
            
            vm.isAuthenticated = function() { return adal.userInfo.isAuthenticated }
            
            vm.micAccess = function() {
                return vm.isAuthenticated() && adal.userInfo.userName.endsWith($config.micdomain);
            }

            vm.login = function() {
                if ($location.protocol() == "http") {
                    var host = $location.host();
                    var url = "https://" + host + "/#Login"
                    window.location = url;
                } else {
                    adal.login();
                }
            };
            
            vm.logout = function() {
                adal.logOut();
            };
            
           vm.getUsername = function() {
                var auth = adal.userInfo.isAuthenticated;
                return (auth && adal.userInfo.profile.name) || "";
            };
            
            vm.isActive = function(viewLocation) { 
                return viewLocation === $location.path();
            };
        }
    ]);
  
    app.directive("topNav", function () {
        return {
            restrict: 'E',
            templateUrl: "/app/views/top-nav.html",
            controller: "topNavCtrl",
            controllerAs: "vm"
        };
    });
  
}());
