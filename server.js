//
// Socket.IO and Express simple example
//
// -------------------------------------------------
var express = require('express');
var app = express();
var http = require('http').Server(app);


var io = require('socket.io')(http);
// var realtime = require('./index');
var fs = require('fs');
//var getData = require('./getData');
var path = require('./config').path;

var httpReq = require('http');
var decode = require('gtfs-realtime-bindings').FeedMessage.decode;
var config = require('./config.js');  
var path = require('./config').path;
var mkdirp = require('mkdirp');
// var getDirName = require('path').dirname;



// Setup public directory for static page serving
app.use(express.static(__dirname + '/publictest'));


// On an initial connection from the broswer, initialize an
//  instance of our server-side web-app
// ------------------------------------
io.on('connection', function(socket) {

    var locationInterval;
    var route;

  // Print a status message to the console when a new browser 
  //   instance connects.
  // -----------------------------
  console.log('a user connected');
//   getData(path.VehiclePositions, 'gtfs-rt/VehiclePositions.json');
//   getData(path.TripUpdates, 'gtfs-rt/TripUpdates.json');




 socket.on('getRoute', function(data){

    try {
        clearInterval(locationInterval);
    }
    catch (error) {
        console.log(error);
    }

    route = data.substr(0, data.indexOf(' '));



    var routeReq = httpReq.request(Object.assign({path: path.VehiclePositions},config.http), (res) => {
         var data = [ ];
         var feed;
     
         res.on('data', (chunk) => {
           data.push(chunk);
         });
     
         res.on('end', () => {
                 var binary = Buffer.concat(data).toString('base64');
                 try {
                     feed = decode(binary);
                     //console.log(feed);
                 }
                 catch (error) {
                    console.log(error);
                }
                 var entityJSON = feed;
                 var entityArr = entityJSON.entity;
                 var busArr = [];
                 //extract data points needed
                 entityArr.forEach(function(element) {
                     if (element.vehicle.trip != null) {
                        if (element.vehicle.trip.route_id === route) {
                            var temp = new Object();
                            temp.id = element.id;
                            temp.latitude = element.vehicle.position.latitude;
                            temp.longitude = element.vehicle.position.longitude;
                            temp.timestamp = element.vehicle.timestamp.low;
                            temp.route_id = element.vehicle.trip.route_id;
                            temp.trip_id = element.vehicle.trip.trip_id;
                            temp.nextStop = {};
                            temp.nextStop.stop_id = element.vehicle.stop_id;
                            busArr.push(temp);
                    }
                }
                 });
    
                 var fd = fs.openSync("./transit-data-files/stops.json", 'r', null);
                 var tripJSON = JSON.parse(fs.readFileSync(fd, 'utf8'));
                 
                 for(var i = 0; i < busArr.length; ++i)
                     for (var j = 0; j < tripJSON.length; ++j)
                         if (busArr[i].nextStop.stop_id == tripJSON[j].stop_id) {
                            busArr[i].nextStop.latitude = tripJSON[j].stop_lat;
                            busArr[i].nextStop.longitude = tripJSON[j].stop_lon;
                            busArr[i].nextStop.description = tripJSON[j].stop_desc;
                            busArr[i].nextStop.stopName = tripJSON[j].stop_name;
                         }
    
                // var fd = fs.openSync("./transit-data-files/trips.json", 'r', null);
                // var tripJSON = JSON.parse(fs.readFileSync(fd, 'utf8'));
                // for(var i = 0; i < busArr.length; ++i)
                //     for (var j = 0; j < tripJSON.length; ++j)
                //         if (busArr[i].trip_id == tripJSON[j].trip_id)
                //             busArr[i].shape_id = tripJSON[j].shape_id;
    
                socket.emit('routeUpdate', busArr);
         });
     });
     try {
    routeReq.end();
     }
     catch (error) {
         console.log(error);
     }
});


function trackBus(selectedBus) {
    //console.log("In track bus ");
    var routeReq2 = httpReq.request(Object.assign({path: path.VehiclePositions},config.http), (res) => {

        var data = [ ];
        var feed;
        var selectedBusId = selectedBus.id.split("_")[1];
    
        res.on('data', (chunk) => {
        data.push(chunk);
        });
    
        res.on('end', () => {
                var binary = Buffer.concat(data).toString('base64');
                try {
                    feed = decode(binary);
                }
                catch (error) {
                    console.log(error);
                }
                feed = JSON.stringify(feed);
                try {
                var entityJSON = JSON.parse(feed);
                }
                catch (error) {
                    return;
                }
                var entityArr = entityJSON.entity;
                var updatedInfo = new Object();
                //extract data points needed
                entityArr.forEach(function(element) {
                    if (element.id.split("_")[1] == selectedBusId) {
                        updatedInfo.latitude = element.vehicle.position.latitude;
                        updatedInfo.longitude = element.vehicle.position.longitude;
                        updatedInfo.nextStop = {};
                        updatedInfo.nextStop.stop_id = element.vehicle.stop_id;
                        updatedInfo.timestamp = element.vehicle.timestamp.low;
                      }
                });

                var fd = fs.openSync("./transit-data-files/stops.json", 'r', null);
                var tripJSON = JSON.parse(fs.readFileSync(fd, 'utf8'));
                    for (var j = 0; j < tripJSON.length; ++j)
                        if (updatedInfo.nextStop.stop_id == tripJSON[j].stop_id) {
                            updatedInfo.nextStop.latitude = tripJSON[j].stop_lat;
                            updatedInfo.nextStop.longitude = tripJSON[j].stop_lon;
                            updatedInfo.nextStop.description = tripJSON[j].stop_desc;
                            updatedInfo.nextStop.stopName = tripJSON[j].stop_name;
                        }

                console.log("latitude: " + updatedInfo.latitude  + " longitude: " + updatedInfo.longitude);
                socket.emit('trackBus', updatedInfo);     
        });
    });
    try {
    routeReq2.end();
    }
    catch (error) {
        console.log(error);
    }
}

socket.on('selectedBus', function(data){
    console.log("in selected bus");
      var selectedBus = data;
      locationInterval = setInterval(function(){
                            trackBus(selectedBus);}, 2000);
});

});


// Setup port 3000 as our webserver
// --------------------------------
http.listen(3000, function() {
	console.log('Listening on #:3000');
});