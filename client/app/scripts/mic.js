(function() {
    
    var app = angular.module('myApp');
    
    function getCurrentQuarter() {
        var quarter = "Q4";
        var month = moment().month();
        if (month < 3) quarter = "Q3";
        else if (month < 7) quarter = "Q4"; // July is like Q4...
        else if (month < 9) quarter = "Q1";
        else quarter = "Q2";
        
        return quarter;
    }
    
    function getChartOptions() {
        return {
                tooltips: {
                    callbacks: {
                        label: function(o, context) { 
                            var value = "$" + (o.yLabel * 1000).toFixed(0).replace(/(\d)(?=(\d{3})+$)/g, "$1 ");
                            return context.datasets[o.datasetIndex].label + ": " + value; 
                        }  
                    }
                },
                scales: {
                    xAxes: [{
                        type: "time",
                        time: {
                            format: "MM/DD/YYYY",
                            round: 'day',
                            tooltipFormat: 'll'
                        }
                    }],
                    yAxes: [{
                        type: "linear",
                        ticks: {
                            min: 0,
                            callback: function(value) { return (value / 1000).toFixed(1).replace(/(\d)(?=(\d{3})+$)/g, "$1 ") + "M$"; }
                        }
                    }]
                }
            };
    }
    
    function formatCurrency(amount) {
        return (amount / 1000).toFixed(0).replace(/(\d)(?=(\d{3})+$)/g, "$1 ") + "k";
    }
  
    app.controller('micCtrl', ['$http', "$location", "$routeParams", "adalAuthenticationService",
        function ($http, $location, $routeParams, adal) {
            var vm = this;
            
            console.log($routeParams.fiscal);

            vm.isAuthenticated = function() { return adal.userInfo.isAuthenticated }
            
            vm.loading = true;
            vm.message = "";
            vm.quarters = [];
            vm.updated = "";
            vm.chartoptions = getChartOptions();
            vm.selectedTab = 0;
            
            var handleError = function(resp) {
                vm.loading = false;
                vm.message = resp.data;
                console.log(resp.data);
            };
            
            function GetChartData(data, quarter) {
                return {
                    labels: data.map(d => { return moment(d.date).toDate(); }),
                    series: [ 
                        "Target PG2", 
                        "Actuals PG2", 
                        "Target PG1", 
                        "Actuals PG1"
                    ],
                    data: [
                       data.map(d => { return d.PG2Target/1000; }),
                       data.map(d => { return d.PG2Actuals/1000; }),
                       data.map(d => { return d.PG1Target/1000; }),
                       data.map(d => { return d.PG1Actuals/1000; })
                    ]   
                };
            }
            
            var view = function() {
                var url = "/api/mic";
                if ($routeParams.fiscal) url += "?fiscal=" + $routeParams.fiscal;
                $http.get(url).then(function(resp) {
                    vm.loading = false;
                    
                    if (!resp.data.lastupdated) return;
                    
                    vm.updated = moment(resp.data.lastupdated).fromNow();
                    var data = resp.data.data;
                    if (!data || data.length == 0) return;
                    
                    var byQuarter = { Q1: [], Q2: [], Q3: [], Q4: [] };
                    data.reduce((prev, current) => {
                        byQuarter[current.quarter].push(current);   
                    });
                    
                    for(var q in byQuarter) {
                        if (byQuarter[q].length > 0) {
                            var qdata = byQuarter[q];
                            var q = {
                                name: q,
                                current: qdata[qdata.length - 1],
                                hist: GetChartData(byQuarter[q], q)
                            };
                            
                            q.current.globalAttainment = ((30*q.current.PG1 + 35*q.current.PG2 + 5*q.current.CRM + 20*q.current.Usage + 10*q.current.Voice)/100).toFixed(0);
                            q.current.nicePG1Togo = formatCurrency(q.current.PG1Togo);
                            q.current.nicePG2Togo = formatCurrency(q.current.PG2Togo);
                            
                            vm.quarters.push(q);
                        }
                    }
                   
                    var idx = vm.quarters.findIndex(q => q.name == getCurrentQuarter());
                    if (idx >= 0) vm.selectedTab = idx;
                });   
            };
            
            if (vm.isAuthenticated()) view();
        }
    ]);
  
}());