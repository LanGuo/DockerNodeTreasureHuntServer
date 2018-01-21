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

function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  var earthRadiusKm = 6371;

  var dLat = degreesToRadians(lat2-lat1);
  var dLon = degreesToRadians(lon2-lon1);

  lat1 = degreesToRadians(lat1);
  lat2 = degreesToRadians(lat2);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return earthRadiusKm * c;
}

function inGeofence(userLat, userLon, targetLat, targetLon, thresholdDistance) {
  distance = haversineDistanceKm(userLat, userLon, targetLat, targetLon);
  console.log(`Distance is ${distance}km`);
  return distance <= thresholdDistance;
}


function huntForTreasure(config, userLat, userLon, thresholdDistance) {
  var userLocation = `latitude: ${userLat}, longitude:${userLon}`;
  var message = `You are at ${userLocation}. Your location has no hidden treasure.`;
  var treasure = null;
  var locations = config.locations;
  for (var i=0; i<locations.length; i++) {
    let {address, name, latitude, longitude, url} = locations[i];
    //console.log(`address:${address}, name:${name}, targetLat:${latitude}, treasureThisLoc:${url}`)
    var nearTreasure = inGeofence(userLat, userLon, latitude, longitude, thresholdDistance);
    if (nearTreasure) {
      treasure = url;
      message = `You are at ${name}. Find the hidden treasure here at ${treasure}!`;
    }
  }
  return {userLocation, message, treasure};
}


// Load config file when start up server
var config = loadYAMLConfig();
var thresholdDistance = haversineDistanceKm(config.locations[0].latitude,
  config.locations[0].longitude,
  config.locations[1].latitude,
  config.locations[1].longitude); // haversine distance between TBL and Voodoo Doughnuts in Km
console.log(`Using distance between TBL and voodoo in km: ${thresholdDistance} as threshold distance.`)

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
    var {userLocation, message, treasure} = huntForTreasure(config, latitude, longitude, thresholdDistance);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(`${message}`);
    res.end()
  }
  else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('Please visit /index.');
    res.end()
  }
}).listen(port);
