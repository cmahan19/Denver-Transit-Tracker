var mongoose = require('mongoose');
var find = require('find-in-files');
var fs = require('fs');

var BusSchema = mongoose.Schema({
    "bus_number" : String,
    "latitude" : [String],
    "longitude" : [String],
    "time" : [String]
});

var BusRoute = mongoose.model('BusRoute', BusSchema);


var data=fs.readFileSync('./gtfs-rt/VehiclePositions.json');
var words=JSON.parse(data);
var entityArr = words.entity;
entityArr.forEach(function(element) {
    console.log("ENTITY\n")
    console.log(element.id + "\n"+element.vehicle.position.latitude + " " + element.vehicle.position.longitude + "\n" + element.vehicle.timestamp.low);
    console.log("\n");
});