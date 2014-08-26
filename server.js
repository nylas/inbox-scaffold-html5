var express = require("express");
var logfmt = require("logfmt");
var app = express();

app.use(logfmt.requestLogger());
app.use('/vendor', express.static(__dirname + '/vendor/inbox.js/build'));
app.use('/', express.static(__dirname + '/public'));

var port = Number(process.env.PORT || 6001);
app.listen(port, function() {
  console.log("Listening on " + port);
});