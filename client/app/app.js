(function() {
    var app = angular.module('myApp', [ 'ngRoute', "AdalAngular", "ngMaterial", "chart.js" ]);
  
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

            }).when("/Login", {
                requireADLogin: true,
                redirectTo: "/Home"

            }).otherwise({ redirectTo: "/Home" });
            
            adalProvider.init({
                tenant: "common",
                clientId: $config.adalAppId
            }, $httpProvider);
    }]);
   
    fetchData().then(launchApplication);

    function fetchData() {
        var initInjector = angular.injector(["ng"]);
        var $http = initInjector.get("$http");
        return $http.get("/api/config").then(function(resp){
            app.constant("$config", resp.data);
        });
    };

    function launchApplication() {
        angular.element(document).ready(function() {
            angular.bootstrap(document, ["myApp"]);
        });
    };
  
}());