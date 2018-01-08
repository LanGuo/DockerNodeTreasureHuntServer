var http = require('http');
var fs = require('fs');
var url = require('url');
var port = 8080

//create a server object:
http.createServer(function (req, res) {
  if (req.url === '/index') {
    fs.readFile('index.html', function(err, data) {
      if (err) {
        res.writeHead(404);
        res.write('Page not found!');
      }
      else {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
      }
      res.end();
    })
  }
  else if (req.url.indexOf('?') === 1) {
    var q = url.parse(req.url, true).query;
    var coor = 'latitude: ' + q.latitude + '; longitude: ' + q.longitude;
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(`The hidden treasure at ${coor} is at ... (some secret gist url)`);
    res.end()
  }
  else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('Please visit /index.');
    res.end()
  }
}).listen(port);
