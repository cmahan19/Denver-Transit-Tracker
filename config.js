var btoa = require('btoa');

// these auth credentials are intended only for testing a development
// Do not use these credentials in a production apps
// Requests for production credentials can me made at the following url:
// http://www.rtd-denver.com/gtfs-developer-guide.shtml
var auth = {
  user: 'RTDgtfsRT',
  pw: 'realT!m3Feed'
};

module.exports = {
  path: {
    VehiclePositions: '/google_sync/VehiclePosition.pb',
    TripUpdates: '/google_sync/TripUpdate.pb'
  },
  http: {
    hostname: 'www.rtd-denver.com',
    // path: 'must be specified when used in http call',
    port: 80,
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + btoa(unescape(encodeURIComponent(auth.user + ':' + auth.pw)))
    }
  }
};
