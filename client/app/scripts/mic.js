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
        var options = {
            tooltips: {
                callbacks: {
                    label: function(o, context) { 
                        if (context.datasets[o.datasetIndex].label.indexOf("Usage") < 0) {
                            var value = "$" + (o.yLabel * 1000).toFixed(0).replace(/(\d)(?=(\d{3})+$)/g, "$1 ");
                            return context.datasets[o.datasetIndex].label + ": " + value; 
                        } else {
                            return context.datasets[o.datasetIndex].label + ": " + o.yLabel; 
                        }
                    }  
                }
            },
            scales: {
                xAxes: [{
                    type: "time",
                    time: {
                        displayFormats: { day: "MM/DD/YYYY" },
                        unit: 'day',
                        round: 'day',
                        tooltipFormat: 'll'
                    }
                }],
                yAxes: [{
                    id: "revenue",
                    type: "linear",
                    ticks: {
                        min: 0,
                        callback: function(value) { return (value / 1000).toFixed(1).replace(/(\d)(?=(\d{3})+$)/g, "$1 ") + "M$"; } //
                    },
                    position: "left",
                    display: true
                },
                {
                    id: "units",
                    type: "linear",
                    ticks: {
                        min: 0,
                        callback: function(value) { return value; }
                    },
                    position: "right",
                    display: true
                }]
            }
        };
        return options;
}
    
    function formatCurrency(amount) {
        return (amount / 1000).toFixed(0).replace(/(\d)(?=(\d{3})+$)/g, "$1 ") + "k"; //
    }
  
    app.controller('micCtrl', ['$http', "$location", "$routeParams", "adalAuthenticationService",
        function ($http, $location, $routeParams, adal) {
            var vm = this;
            
            vm.isAuthenticated = function() { return adal.userInfo.isAuthenticated }

            vm.loading = true;
            vm.message = "";
            vm.quarters = [];
            vm.updated = "";
            vm.chartoptions = getChartOptions();

            vm.getDatasetOverride = function(show) {
                var axis = [
                    { yAxisID: 'revenue' },
                    { yAxisID: 'revenue' },
                    { yAxisID: 'revenue' },
                    { yAxisID: 'revenue' },
                    { yAxisID: 'units' },
                    { yAxisID: 'units' },
                    { yAxisID: 'units' },
                    { yAxisID: 'units' }
                ];
                return axis.filter((e, i) => show[i]);
            }

            vm.selectedTab = 0;
            
            var handleError = function(resp) {
                vm.loading = false;
                vm.message = resp.data;
                console.log(resp.data);
            };
            
            function GetChartData(data, quarter) {
                var show = [ quarter.showgraph.pg1, quarter.showgraph.pg1, 
                             quarter.showgraph.pg2, quarter.showgraph.pg2, 
                             quarter.showgraph.usage, quarter.showgraph.usage, quarter.showgraph.usage, quarter.showgraph.usage ];
                var chartdata = {
                    getLabels: function(show) {
                        return data.map(d => { return moment(d.date).toDate(); }).filter((e, i) => show[i]);
                    },
                    getSeries: function(show) {
                        return [ 
                            "Target PG1", 
                            "Actuals PG1",
                            "Target PG2", 
                            "Actuals PG2",
                            "Target Usage 365",
                            "Actuals Usage 365",
                            "Target Usage EMS",
                            "Actuals Usage EMS"
                        ].filter((e, i) => show[i]);
                    },
                    getData: function(show) {
                        return [
                            data.map(d => { return d.PG1Target/1000; }),
                            data.map(d => { return d.PG1Actuals/1000; }),
                            data.map(d => { return d.PG2Target/1000; }),
                            data.map(d => { return d.PG2Actuals/1000; }),
                            data.map(d => { return d.UsageTarget; }),
                            data.map(d => { return d.UsageActuals; }),
                            data.map(d => { return d.EMSUsageTarget; }),
                            data.map(d => { return d.EMSUsageActuals; })
                        ].filter((e, i) => show[i]);
                    }
                };
                return chartdata;
            }
            
            var view = function() {
                var url = "/api/mic";
                if ($routeParams.fiscal) url += "?fiscal=" + $routeParams.fiscal;
                $http.get(url).then(function(resp) {
                    vm.loading = false;
                    
                    if (!resp.data.lastupdated) return;
                    
                    vm.updated = moment(resp.data.lastupdated).fromNow();
                    console.log("updated " + vm.updated);

                    var data = resp.data.data;
                    if (!data || data.length == 0) return;
                    
                    var byQuarter = { Q1: [], Q2: [], Q3: [], Q4: [] };
                    data.reduce((prev, current) => {
                        byQuarter[current.quarter].push(current);
                    }, {});
                    
                    for(var qu in byQuarter) {
                        if (byQuarter[qu].length > 0) {
                            var qdata = byQuarter[qu];
                            var q = {
                                name: qu,
                                current: qdata[qdata.length - 1],
                                showgraph: { pg1: true, pg2: true, usage: true }
                            };

                            q.hist = GetChartData(qdata, q);                            
                            q.current.globalAttainment = ((50*q.current.PG1 + 20*q.current.PG2 + 20*q.current.Usage + 10*q.current.EMSUsage)/100).toFixed(0);
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