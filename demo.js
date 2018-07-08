
var MongoClient = require('mongodb').MongoClient;//this creates a mongo client to make queries to the database.
var url = 'mongodb://localhost:27017';//This is the connection URL.

var makeRouteTimeQuery = function(oneRoute, initDate, endDate){
	var _query = {};

	var _query = {};

	//we create the end date to make the query with the current day.
	var _finishingDate = new Date();

	// If the end data is given to the function then we asign it
	if(endDate)
		_finishingDate = endDate;

	//If there is no initial date we look for the full past week starting from the end date
	var _initialDate = new Date(_finishingDate.getTime()-(7*24*60*60*1000));

	//Just like the finishing date, if there is an initial date given to the function  we'll asign it
	if(initDate)
		_initialDate = initDate;

	//Once the limits of this search are given we create the query object
	_query = {};
	_query.routeMarj = oneRoute.marj;
	_query.routeMino = oneRoute.mino;


	let lastBeacon = oneRoute.beacons[oneRoute.beacons.length-1];
	lastBeacon = lastBeacon+".rawMainTime";
	
	_query[lastBeacon] = {};
	_query[lastBeacon].$gte = _initialDate.getTime();

	_query[lastBeacon].$lt = _finishingDate.getTime();
	
	console.log("QUERY IS: ",_query)

	console.log("_initialDate",_initialDate);
	console.log("_finishingDate",_finishingDate);

	return _query;
}

MongoClient.connect(url, function(err, db) {
	//Quite simple, if there is something wrong, throw an exception.
	if (err) throw err;

	var initialDate;
	var finishingDate;

	var oneRoute = { "_id" : "5afae5712ee55b0cbf23d655", "nombre" : "Temp", "marj" : "000F", "mino" : "17C1", "beacons" : [ "3739794", "7792632", "4371333", "1061037", "16639475", "8909802", "566770", "4440430", "3738973", "16638430", "3740195", "4427747" ] };

	// we declare the name of the database
	var dbo = db.db("mydb");

	// an empty object is create to make the query
	var query = {};

	var _query = makeRouteTimeQuery(oneRoute);	


	dbo.collection("Laps").find(_query).toArray(function(err,result){
		if(err) throw err;



		result.forEach(function(item){
			//console.log(item);
		})

		db.close();
	});//End of "find" callback


});//End of "on-connect" callback