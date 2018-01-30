var treasureDiv = document.getElementById("showTreasure");


function huntAt(lat, lon) {
  var position = {
    coords: {
      latitude: lat,
      longitude: lon
    }
  };
  sendPositionToServer(position);
}

function getLocationAndHunt() {
  treasureDiv.innerHTML =
`
<h6>Searching for Treasure…</h6>
`;
  try {
    if (navigator.geolocation) {
      console.log('Before getCurrentPosition');
      navigator.geolocation.getCurrentPosition(pos => {
        sendPositionToServer(pos);
      });
    }
    else {
      console.log('Geolocation not supported.')
      treasureDiv.innerHTML =
`<h1>
Geolocation is not supported by this browser.
</h1>
`;
    }
  }
  catch (e) {
    console.log('Error getting geolocation', e);
      treasureDiv.innerHTML =
`<h1>
Error getting geolocation: ${e}.
</h1>
`;
  }
}

function sendPositionToServer(position) {
  console.log('Sending position to server');
  var latitude = position.coords.latitude;
  var longitude = position.coords.longitude;
  // Make a request to server with the current latitude and longitude
  var positionReqURL = `/?latitude=${latitude}&longitude=${longitude}`;
  var positionReq = new XMLHttpRequest();
  positionReq.onreadystatechange = function() {
    if (positionReq.readyState === 4) {
      if (positionReq.status === 200) {
        const responseText = positionReq.responseText;
        console.log('responseText', responseText);
        const response = JSON.parse(responseText);
        treasureDiv.innerHTML =
`<pre class="pre-scrollable">
${positionReq.responseText}
</pre>
`;
        if (response.url) {
          treasureDiv.innerHTML +=
`<a target="_blank" href="${response.url}">${response.name}</a>
`;
        }
      }
      else {
        console.log('Fail to send geolocation to server', positionReq.status);
      }
    }
  };
  positionReq.open('POST', positionReqURL);
  positionReq.send();
}
