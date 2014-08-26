var express = require("express");
var fs = require('fs');
var logfmt = require("logfmt");
var less = require("less");
var app = express();


// For development: render less to css with no caching
app.get("*.less", function(req, res) {
  var path = __dirname + '/public' + req.url;
  fs.readFile(path, "utf8", function(err, data) {
    if (err) throw err;
    less.render(data, function(err, css) {
      if (err) throw err;
      res.type("text/css");
      res.send(css);
    });
  });
});

app.use(logfmt.requestLogger());
app.use('/', express.static(__dirname + '/public'));

var port = Number(process.env.PORT || 6001);
app.listen(port, function() {
  console.log("Listening on " + port);
});