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

function inGeofence(name, userLat, userLon, targetLat, targetLon, thresholdDistance) {
  distance = haversineDistanceKm(userLat, userLon, targetLat, targetLon);
  console.log(`Distance to ${name} is ${distance}km`);
  return thresholdDistance - distance;
}


function huntForTreasure(config, userLat, userLon, thresholdDistance) {
  var userLocation = `latitude: ${userLat}, longitude:${userLon}`;
  var treasureLocation = null;
  var treasureCloseness = 0;
  var locations = config.locations;
  for (var i = 0; i < locations.length; i++) {
    let location = locations[i];
    let {address, name, latitude, longitude, url} = location;
    //console.log(`address:${address}, name:${name}, targetLat:${latitude}, treasureThisLoc:${url}`)
    var closeness = inGeofence(name, userLat, userLon, latitude, longitude, thresholdDistance);
    if (closeness > treasureCloseness) {
      treasureLocation = location;
      treasureCloseness = closeness;
    }
  }
  return treasureLocation;
}


// Load config file when start up server
var config = loadYAMLConfig();
var thresholdDistance = haversineDistanceKm(
  config.locations[0].latitude,
  config.locations[0].longitude,
  config.locations[1].latitude,
  config.locations[1].longitude); // haversine distance between TBL and Voodoo Doughnuts in Km
console.log(`Using distance between TBL and voodoo in km: ${thresholdDistance} as threshold distance.`)

// create a server object:
http.createServer(function (req, res) {
  const reqUrl = req.url;
  var q = url.parse(reqUrl, true).query;
  const hasParams = reqUrl.indexOf('?') === 1;
  if (reqUrl === '/client.js') {
    fs.readFile('client.js', function(err, data) {
      if (err) {
        res.writeHead(404);
        res.write('File not found!');
      }
      else {
        res.writeHead(200, {'Content-Type': 'application/javascript'});
        res.write(data);
      }
      res.end();
    });
  }
  else if (reqUrl === '/' && !hasParams) {
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
    });
  }
  else if (hasParams) {
    //var coor = 'latitude: ' + q.latitude + '; longitude: ' + q.longitude;
    var latitude = q.latitude;
    var longitude = q.longitude;
    var huntResponse = huntForTreasure(config, latitude, longitude, thresholdDistance);
    console.log('huntResponse', huntResponse);
    if (!huntResponse) {
      huntResponse = {};
    }

    huntResponse.search_latitude = latitude;
    huntResponse.search_longitude = longitude;
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(huntResponse, null, 2));
    res.end()
  }
  else {
    res.writeHead(302, {Location: "/"});
    res.end()
  }
}).listen(port);
