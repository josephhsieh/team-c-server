/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');
var moment = require('moment');

// create a new express server
var app = express();

var collections = ["door_sensor", "door_status", "heat_sensor", "light_sensor", "motion_status", "temperature_sensor"];
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = 'mongodb://hackathon:hackathon@aws-us-east-1-portal.11.dblayer.com:28115/hackathon';

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

var router = express.Router();              // get an instance of the express Router



var getMotionStatus = function(callback) {
	console.log('getMotionStatus');
	MongoClient.connect(url, function (err, db) {
		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:', err);
			callback('Unable to connect to the mongoDB server. Error:' + err);
		} else {
		   	console.log('Connection established to', url);

			var got = false;
		   	db.collection('motion_status').find({}).sort({"timestamp":-1}).each(function(err, doc) {
		   		if (err) {
		   			console.log('Error: ', err);
		   		}

		    	if (doc && !got) {
			        got = true;
			        if (doc[Object.keys(doc)[3]] === "Active") {
			            // callback("");
			        } else {
			        	// callback("");
			        }
			    }
		   	});
		}
	});
};

var getTempSensors = function(callback) {
	console.log('getTempSensors');
	MongoClient.connect(url, function (err, db) {
		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:', err);
			callback('Unable to connect to the mongoDB server. Error:' + err);
		} else {
		   	console.log('Connection established to', url);

			var got = false;
		   	db.collection('temperature_sensor').find({}).sort({"payload.timestamp": -1}).each(function(err, doc) {
		   		if (err) {
		   			console.log('Error: ', err);
		   		}
		   		
		   		if (doc && !got) {
		   			var payload = doc[Object.keys(doc)[1]];
            		var topic = payload[Object.keys(payload)[0]];
            		if (topic.indexOf('currentTemperature') !== -1) {
            			var temp = Number(payload[Object.keys(payload)[2]]);
            			got = true;
            			if (temp > 35) {
            				callback('Projector is in-use');
            			} else {
            				callback('Projector is not in use');
            			}
            		}	
		   		}
			});
		}
	});
};

var getDoorStatus = function(callback) {
	console.log('getDoorStatus');
	MongoClient.connect(url, function (err, db) {
		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:', err);
			callback('Unable to connect to the mongoDB server. Error:' + err);
		} else {
		   	console.log('Connection established to', url);

			var got = false;
		   	db.collection('door_status').find({}).sort({"timestamp":-1}).each(function(err, doc) {
		   		if (err) {
		   			console.log('Error: ', err);
		   		}

		    	if (doc && !got) {
			        var lastDateDoorChanged = new Date(doc[Object.keys(doc)[2]]);
			        var secondsDiff = moment().diff(lastDateDoorChanged, "minutes");
			        got = true;
			        if (secondsDiff > 60 && doc[Object.keys(doc)[3]] === "Closed") {
			            callback("Room is available");
			        } else {
			        	callback("Room is not available");
			        }
			    }
		   	});
		}
	});
};



// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
	res.json({ message: 'TEAM-C API Working!' });   
});


router.get('/availablerooms', function(req, res) {
	
 	getDoorStatus(function(resMsg){
 		res.json({ message: resMsg});
 	});
});

router.get('/projectorstatus', function(req, res) {

	getTempSensors(function(resMsg){
		res.json({ message: resMsg});
	});
});




// all of our routes will be prefixed with /api
app.use('/api', router);

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
