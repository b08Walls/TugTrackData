const express = require('express')//library to order server
const path = require('path')//library to find paths in the files
const PORT = process.env.PORT || 5001//port to work with

var app = require('express')();//creates web app.
var http = require('http').Server(app);//
var statisticsTools = require('./statisticsTools.js');//statisticsTools.js is a library with all the functions needed to capture the data

var MongoClient = require('mongodb').MongoClient;//this creates a mongo client to make queries to the database.
var url = 'mongodb://localhost:27017';//This is the connection URL.
var io = require('socket.io')(http);//This creates a socket with the web page in order to have real time stats

var statisticsRouteObjects = {};


//***************************************************************************************************
//*** SERVER FUNCTIONS ******************************************************************************
//***************************************************************************************************

app.use(express.static(__dirname+'/public'))

app.get('/app.js',function(req,res)
{
	//res.send('<h1>Hello world</h1>');
	res.sendFile(__dirname+'/app.js');
});

//This function returns main paige with the main html code to the browser
app.get('/',function(req,res)
{
	//res.send('<h1>Hello world</h1>');
	res.sendFile(__dirname+'/form.html');
});


//Here we check mongoDB and return it to the browser in order to capture the data.
app.get('/demoMongo',function(req,res)
{
	MongoClient.connect(url,function(err,db){
		if(err){
			console.log("error en conexion");
			throw err;
		}



		var dbo = db.db("mydb");
		dbo.collection("Laps").find({}).toArray(function(err,result){
			if(err){
				console.log("error en query");
				throw err;
			}

			let _sendObject = {resultado:result};
			let _respuesta = ""+JSON.stringify(_sendObject);
			res.send(_respuesta);
			//console.log(_respuesta);
			db.close();
		});
	})


	var cargarDatos = function(valores)
	{
		if(valores != undefined){
			console.log("el resultado esta definido");

			var respuesta = "";

			valores.forEach(function(item){
				respuesta += JSON.stringify(item);
			})

			res.send(respuesta);
		}
		else{
			console.log("el resultado no esta definido");
		}	
	}
	//res.sendFile(__dirname+'/app.js');
});

app.get('/getRutas',function(req,res)
{
	MongoClient.connect(url,function(err,db){
		if(err){
			console.log("error en conexion");
			throw err;
		}

		var dbo = db.db("mydb");
		dbo.collection("RutasTugger").find({}).toArray(function(err,result){
			if(err){
				console.log("error en query");
				throw err;
			}

			let _sendObject = {resultado:result};
			let _respuesta = ""+JSON.stringify(_sendObject);
			res.send(_respuesta);
			//console.log(_respuesta);
			db.close();
		});
	});
});


/*This function is part of the web API, in order to use this request we need:
	-	collection <- this one is obligatory field
	-	mongoQuery <- optional
*/


app.get('/makeQuery',function(req,res){

	/*First we create the object that we'll send back to the frontend*/
	let _resultado = {};

	/*If there is no collection parameter in the get request we must send back an error*/
	if(!req.query.collection){
		//We set resCode to -1 = ERROR
		_resultado.resCode = false;
		//The response string is created from the object.
		let _response = JSON.stringify(_resultado);
		//the response is sent.
		res.send(_response);
		return;
	}

	let _collection = req.query.collection;

	/*if there is a collection param, we create an empty query object. Unlike the collection param
	query param can be missing, since it means find all the elements in the collection.*/

	let _query = {};

	//If there is a query in the request we asign it to the _query object
	if(req.query.mongoQuery){
		try{
			_query = JSON.parse(req.query.mongoQuery);
		}catch(err){
			//We set resCode to -1 = ERROR
			_resultado.resCode = false;
			//The response string is created from the object.
			let _response = JSON.stringify(_resultado);
			//the response is sent.
			res.send(_response);
			return;
		}
	}


	MongoClient.connect(url,function(err,db){
		if(err){
			console.log("error en conexion");
			throw err;
		}

		var dbo = db.db("mydb");
		dbo.collection(_collection).find(_query).toArray(function(err,result){
			if(err){
				console.log("error in query")
				//We set resCode to -1 = ERROR
				_resultado.resCode = false;
				//The response string is created from the object.
				let _response = JSON.stringify(_resultado);
				//the response is sent.
				res.send(_response);
				throw err;
			}

			_resultado.resCode = true;

			_resultado.mongoResult = result;


			let _response = JSON.stringify(_resultado);
			res.send(_response);
			db.close();
		})
	});
});

//***************************************************************************************************
//*** REAL TIME DATA SECTION ************************************************************************
//***************************************************************************************************

/*This function handls all necesary process to send the realtime data from the data base.*/
var refreshData = function(){

	/*This function encapsulates the instructions needed to send data through the socket*/
	var sendData = function(dataToSend){
		//Makes a little debugging print
		console.log(dataToSend);
		//And send the data with the corresponding topic
		io.emit('newData',dataToSend);
	}

	/*Here we try to connect to the database in order to get all the raw data*/
	MongoClient.connect(url,function(err,db){
		/*We check that if there is an error in the connection*/
		if(err){
			console.log("ERROR DATABASE CONNECTION");
			throw err;
		}

		//If everything ok we declare the database we are making queries to.
		var dbo = db.db("mydb");
		//Then we make the query, asking to find any document in the RutasTugger collection and to deliver the result
		//as an array. 
		dbo.collection("RutasTugger").find({}).toArray(function(err,result){
			//Once again catching for errors.
			if(err){
				console.log("ERROR IN ROUTES QUERY");
				throw err;
			}

			//Once we have a result we have to check document by document, this is achieved with a forEach function
			result.forEach(function(xRoute){

				/*With each document we create a RouteDeviceObject. These objects have the functions and properties to
				calculate with acuracy all the statistic data. Basically this objects are containers, that accumulate all
				the laps that the system had registered and with each new element it recalculates all the values.*/
				statisticsRouteObjects[""+xRoute.marj+xRoute.mino] = statisticsTools.newRouteDeviceObject(xRoute);
			})
		});


		/*In the past query to the database we create all the objects for each route in the system, now we have to fill this
		objects with the Laps in the database.*/
		dbo.collection("Laps").find({}).toArray(function(err,result){
			if(err){
				console.log("ERROR IN LAPS");
				throw err;
			}

			result.forEach(function(xLap,index,arr){

				//We add laps to the system in order to make the data change.
				statisticsRouteObjects[""+xLap.routeMarj+xLap.routeMino].addLap(xLap);
				//Finally we load also some important data into the object
				statisticsRouteObjects[""+xLap.routeMarj+xLap.routeMino].allData = statisticsRouteObjects[""+xLap.routeMarj+xLap.routeMino].getAllData();
				
				if(index == arr.length-1){
					//When we are in the last object in the array we preppare the data
					let dataToSend = {};
					dataToSend = statisticsRouteObjects;
					sendData(statisticsRouteObjects);
				}
			})

			//Now we can close comms with the database.
			db.close();
		});
	});
}

setInterval(refreshData,3000);

//***************************************************************************************************
//*** REAL TIME DATA SECTION ************************************************************************
//***************************************************************************************************

http.listen(PORT,function(){console.log("INIT OK!")})

// express()
//   .use(express.static(path.join(__dirname, 'public')))
//   .set('views', path.join(__dirname, 'views'))
//   .set('view engine', 'ejs')
//   .get('/', (req, res) => res.render('pages/index'))
//   .listen(PORT, () => console.log(`Listening on ${ PORT }`))




