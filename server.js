var http = require('http');
var fs = require('fs');
var url = require('url');
var yaml = require('js-yaml')
var port = 8080



function loadYAMLConfig() {
  var config = null;
  try {
    config = yaml.safeLoad(fs.readFileSync('./locations.yml', 'utf8'));
    console.log('YAML config file loaded, showing config.locations:', config.locations);
} catch (e) {
    console.log(e);
}
  return config;
}


function inGeofence(userLat, userLon, targetLat, targetLon) {
  var latDelta = userLat - targetLat;
  var lonDelta = userLon - targetLon;
  var distanceSquared = latDelta * latDelta + lonDelta * lonDelta;
  var thresholdDistanceSquared = 0.000000000123; // distance between TBL and Voodoo Doughnuts
  return distanceSquared <= thresholdDistanceSquared;
}


function huntForTreasure(config, userLat, userLon) {
  var message = 'Your location has no hidden treasure';
  var treasure = null;
  var locations = config.locations;
  for (var i=0; i<locations.length; i++) {
    let {address, name, targetLat, targetLon, treasureThisLoc} = locations[i];
    var nearTreasure = inGeofence(userLat, userLon, targetLat, targetLon);
    if (nearTreasure) {
      message = `You are at ${name}`;
      treasure = treasureThisLoc;
    }
  }
  return {message, treasure};
}


// Load config file when start up server
var config = loadYAMLConfig();

// create a server object:
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
    //var coor = 'latitude: ' + q.latitude + '; longitude: ' + q.longitude;
    var latitude = q.latitude;
    var longitude = q.longitude;
    var {message, treasure} = huntForTreasure(config, latitude, longitude);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(`${message}. The hidden treasure here is ${treasure}.`);
    res.end()
  }
  else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('Please visit /index.');
    res.end()
  }
}).listen(port);
