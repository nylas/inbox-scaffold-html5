var coffeescript = require('coffee-script');
var coffeeMiddleware = require('coffee-middleware');
var express = require("express");
var expressLess = require('express-less');
var fs = require('fs');
var logfmt = require("logfmt");
var request = require('request');

var app = express();

app.use(logfmt.requestLogger());
app.use('/', express.static(__dirname + '/public'));
app.use('/components', express.static(__dirname + '/bower_components'));
app.use('/css', expressLess(__dirname + '/public/css'));
app.use(coffeeMiddleware({
    src: __dirname + '/public'
}));

var port = Number(process.env.PORT || 6001);
app.listen(port, function() {
  console.log("Listening on " + port);
});
