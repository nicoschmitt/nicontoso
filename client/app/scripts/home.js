(function() {
    
    var app = angular.module('myApp');
  
    app.controller('homeCtrl', ['$http', "$location", "adalAuthenticationService",
        function ($http, $location, adal) {
            var vm = this;
            
            vm.isAuthenticated = function() { return adal.userInfo.isAuthenticated }
            
            vm.loading = false;
            vm.message = "";
            vm.name = "";
            vm.checked = [];
            
            var handleError = function(resp) {
                vm.loading = false;
                vm.message = resp.data;
                console.log(resp.data);
            };
            
            vm.checkTenant = function() {
                vm.name = vm.name.trim();
                vm.loading = true;
                $http.get("/api/tenant/" + vm.name).then(function(resp) {
                    vm.loading = false;
                    vm.checked.unshift({
                        name: vm.name,
                        taken: resp.data.taken 
                    });
                    vm.name = "";
                });   
            }
        }
    ]);
  
}());