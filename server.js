require('dotenv').config({silent: true});

var mongo = process.env.MONGO_URI;
if (!mongo) {
    console.log("Missing configuration. Exiting.");
    process.exit();
}

var env = process.env.NODE_ENV || "development";
console.log("Env: " + env);
    
var path = require('path');
var compression = require("compression");

var mongoose = require("mongoose");
mongoose.connect(mongo);

var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("etag", false);

var myserver = require("./server/start-http");
if (process.env.FORCE_HTTPS) {
    myserver.forceHttps(app);
}

require("./server/auth/auth-config").register(app);

require('./server/routes').register(app);

app.use(compression());
app.use(express.static(path.resolve(__dirname, 'client')));

myserver.start(app);
