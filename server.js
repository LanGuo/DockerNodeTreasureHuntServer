const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');
const yaml = require('js-yaml')
const qs = require('querystring');
const host = '127.0.0.1';
const port = 8080

function loadYAMLConfig() {
  let config = null;
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
  const earthRadiusKm = 6371;

  const dLat = degreesToRadians(lat2-lat1);
  const dLon = degreesToRadians(lon2-lon1);

  lat1 = degreesToRadians(lat1);
  lat2 = degreesToRadians(lat2);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return earthRadiusKm * c;
}

/* Deprecated function
function inGeofence(name, userLat, userLon, targetLat, targetLon, thresholdDistance) {
  distance = haversineDistanceKm(userLat, userLon, targetLat, targetLon);
  console.log(`Distance to ${name} is ${distance}km`);
  return thresholdDistance - distance;
}
*/

function findClosestLocToUser(locationsList, userLat, userLon){
  let smallestDistance = null;
  let closestLocInd = 0;
  for (let i = 0; i < locationsList.length; i++) {
    let location = locationsList[i];
    let {address, name, latitude, longitude, url} = location;
    let distanceToThisLoc = haversineDistanceKm(userLat, userLon, latitude, longitude);
    console.log(`Distance to ${name} is ${distanceToThisLoc}km`);
    if (i === 0) {
      smallestDistance = distanceToThisLoc;
    }
    else {
      if (distanceToThisLoc < smallestDistance) {
        smallestDistance = distanceToThisLoc;
        closestLocInd = i;
      }
    }
  }
  return {closestLocInd, smallestDistance};
}

function huntForTreasure(config, userLat, userLon) {
  // const userLocation = `latitude: ${userLat}, longitude:${userLon}`;
  let treasureLocation = {'search_latitude': userLat,
    'search_longitude': userLon};
  const locations = config.locations;
  let {closestLocInd, smallestDistance} = findClosestLocToUser(locations, userLat, userLon);
  const thresholdDistance = locations[closestLocInd].thresholdKm;
  if (smallestDistance <= thresholdDistance) {
    treasureLocation = Object.assign(locations[closestLocInd], treasureLocation);
  }
  else {
    treasureLocation = Object.assign({'message':'No treasure at your location. Walk around and explore some more!'
      }, treasureLocation);
  }
  return treasureLocation;
}


// Load config file when start up server
const config = loadYAMLConfig();

// create a server object and pass in request handler function
server = http.createServer( function(req, res) {
  const { method, url } = req;
  let body = '';
  req.on('error', (err) => {
    console.error(err);
  })
  .on('data', (chunk) => {
    body += chunk;
  })
  .on('end', () => {
    if (method == 'POST') {
      //console.log("POST");
      //console.log(body);
      const postParams = qs.parse(body);
      const latitude = postParams.latitude;
      const longitude = postParams.longitude;
      console.log(`latitude is ${latitude}, longitude is ${longitude}`);
      console.log('hunting');
      const huntResponse = huntForTreasure(config, latitude, longitude);
      console.log('huntResponse', huntResponse);
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.write(JSON.stringify(huntResponse, null, 2));
      res.end();
    }
    else if (method == 'GET') {
      // console.log("GET");
      if (url === '/client.js') {
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
      else if (url === '/') {
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
    }

  });
});

server.listen(port, host);


//const thresholdDistance = 0.3;
/*
haversineDistanceKm(
  config.locations[0].latitude,
  config.locations[0].longitude,
  config.locations[1].latitude,
  config.locations[1].longitude); // haversine distance between TBL and Voodoo Doughnuts in Km
*/
//console.log(`Using ${thresholdDistance} kilometers as threshold distance.`);

// options for https using self-signed certificate

//const options = {
//  key: fs.readFileSync('./server.key'),
//  cert: fs.readFileSync('./server.crt')
//};


/* OLD CODE
http.createServer(function (req, res) {
  const reqUrl = req.url;
  const q = url.parse(reqUrl, true).query;
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
    const latitude = q.latitude;
    const longitude = q.longitude;
    //console.log(`latitude is ${latitude}, longitude is ${longitude}`);
    const huntResponse = huntForTreasure(config, latitude, longitude);
    //console.log('huntResponse', huntResponse);
    const serverResponse = {};
    if (!huntResponse) {
      serverResponse.search_latitude = latitude;
      serverResponse.search_longitude = longitude;
    }
    else {
      serverResponse = huntResponse;
      serverResponse.search_latitude = latitude;
      serverResponse.search_longitude = longitude;
    }
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(serverResponse, null, 2));
    res.end();
  }
  else {
    res.writeHead(302, {'Location': "/"});
    res.end();
  }
}).listen(port);
*/