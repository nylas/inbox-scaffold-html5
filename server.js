var express = require("express");
var fs = require('fs');
var logfmt = require("logfmt");
var app = express();

var less = new(require("less").Parser)({
  paths: [ __dirname + '/public/css']
});


// For development: render less to css with no caching
app.get("*.less", function(req, res) {
  var path = __dirname + '/public' + req.url;
  fs.readFile(path, "utf8", function(err, data) {
    if (err) return res.send(404, err);
    less.parse(data, function(err, tree) {
      if (err) return res.send(400, err);
      res.type("text/css");
      res.send(tree.toCSS());
    });
  });
});

app.use(logfmt.requestLogger());
app.use('/', express.static(__dirname + '/public'));

var port = Number(process.env.PORT || 6001);
app.listen(port, function() {
  console.log("Listening on " + port);
});