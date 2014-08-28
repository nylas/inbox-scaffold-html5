var express = require("express");
var fs = require('fs');
var logfmt = require("logfmt");
var request = require('request');
var MD5 = require('crypto-js/md5');
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

app.get("/avatar/:email", function(req, res) {
  var email = req.params['email'];
  var domain = email.split('@')[1];
  var hash = MD5(email);

  res.setHeader('Cache-Control', 'max-age=31556926');

  var urls = ["http://www."+domain+"/favico.ico",
              "http://www."+domain+"/favico.png",
              "http://www."+domain+"/favicon.ico",
              "http://www."+domain+"/favicon.png",
              "http://www.gravatar.com/avatar/" + hash + '?d=404'];

  var getNext = function() {
    var url = urls.pop();
    if (url == undefined) {
      res.setHeader('Content-Type', 'image/gif');
      return res.end(new Buffer("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"));
    }
    request({url: url, encoding: null}, function (error, response, body) {
      if (error || (response.headers['content-type'].indexOf('image') == -1) || (response.statusCode != 200))
        return getNext();
      res.setHeader('Content-Disposition', response.headers['content-disposition'] || 'inline');
      res.setHeader('Content-Type', response.headers['content-type']);
      res.end(body);
    });
  };

  getNext();
});

app.use(logfmt.requestLogger());
app.use('/', express.static(__dirname + '/public'));

var port = Number(process.env.PORT || 6001);
app.listen(port, function() {
  console.log("Listening on " + port);
});