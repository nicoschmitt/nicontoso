(function() {
    var app = null;

    if (window !== window.parent) {

        // dummy app to use during login process
        console.log("dummy app for login");
        app = angular.module("myApp", [ "AdalAngular", "angulartics" ])
                    .config(["$config", '$httpProvider', 'adalAuthenticationServiceProvider', function ($config, $httpProvider, adalProvider) {
                        adalProvider.init({
                            clientId: $config.adalAppId,
                        }, $httpProvider);
                    }]);

    } else {

        // real application
        var app = angular.module('myApp', [ 'ngRoute', "AdalAngular", "ngMaterial", "chart.js", 'angulartics', 'angulartics.google.analytics' ]);
        app.config(["$config", '$routeProvider', '$httpProvider', "adalAuthenticationServiceProvider",
            function ($config, $routeProvider, $httpProvider, adalProvider) {

                $routeProvider.when("/Home", {
                    templateUrl: "/app/views/home.html",
                    controller: "homeCtrl",
                    controllerAs: "vm"
                    
                }).when("/Mic", {
                    requireADLogin: true,
                    templateUrl: "/app/views/mic.html",
                    controller: "micCtrl",
                    controllerAs: "vm"

                }).when("/UCWA", {
                    requireADLogin: true,
                    templateUrl: "/app/views/ucwa.html",
                    controller: "ucwaCtrl",
                    controllerAs: "vm"

                }).when("/Login", {
                    requireADLogin: true,
                    redirectTo: "/Home"

                }).otherwise({ redirectTo: "/Home" });
                
                adalProvider.init({
                    tenant: "common",
                    clientId: $config.adalAppId,
                    anonymousEndpoints: [ "/views", "/api/config", "/api/tenant" ],
                    endpoints: {
                        "https://webdir.online.lync.com": "https://webdir.online.lync.com"
                    }
                }, $httpProvider);
        }]);

    }
   
    fetchData().then(launchApplication);

    function fetchData() {
        var initInjector = angular.injector(["ng"]);
        var $http = initInjector.get("$http");
        return $http.get("/api/config").then(function(resp){
            app.constant("$config", resp.data);
            // start google analytics
            if (ga && window === window.parent) ga('create', resp.data.analytics, 'auto');
        });
    };

    function launchApplication() {
        angular.element(document).ready(function() {
            angular.bootstrap(document, ["myApp"]);
        });
    };
  
}());