(function(){
    
    var register = function(app) {
        app.use("/api*", function(req, res, next) {
            res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
            res.header('Expires', '-1');
            res.header('Pragma', 'no-cache');
            next(); 
        });
        
        app.use('/api/config', require('./api/config'));
        app.use('/api/tenant', require('./api/tenant'));
        app.use('/api/rss', require('./api/rss'));
        app.use('/api/mic', require('./api/mic'));
        app.use('/api/redirect', require('./api/redirect'));
    };

    module.exports.register = register;

}());
