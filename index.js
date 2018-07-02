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


var refreshData = function(){

	var sendData = function(dataToSend){
		console.log(dataToSend);
		io.emit('newData',dataToSend);
	}

	MongoClient.connect(url,function(err,db){
		if(err){
			console.log("ERROR DATABASE CONNECTION");
			throw err;
		}

		var dbo = db.db("mydb");
		dbo.collection("RutasTugger").find({}).toArray(function(err,result){
			if(err){
				console.log("ERROR IN ROUTES QUERY");
				throw err;
			}

			result.forEach(function(xRoute){

				// statisticsRouteObjects.push(statisticsTools.newRouteDeviceObject(xRoute));
				statisticsRouteObjects[""+xRoute.marj+xRoute.mino] = statisticsTools.newRouteDeviceObject(xRoute);

			})
		});

		dbo.collection("Laps").find({}).toArray(function(err,result){
			if(err){
				console.log("ERROR IN LAPS");
				throw err;
			}

			result.forEach(function(xLap,index,arr){

				statisticsRouteObjects[""+xLap.routeMarj+xLap.routeMino].addLap(xLap);
				statisticsRouteObjects[""+xLap.routeMarj+xLap.routeMino].allData = statisticsRouteObjects[""+xLap.routeMarj+xLap.routeMino].getAllData();
				//console.log("lap agregada",xLap);
				//console.log(statisticsRouteObjects[""+xLap.routeMarj+xLap.routeMino].getAllData())
				if(index == arr.length-1){


					let dataToSend = {}

					dataToSend = statisticsRouteObjects;

					sendData(statisticsRouteObjects);
				}
			})
			db.close();
		})

		
	});
}


app.use(express.static(__dirname+'/public'))

app.get('/app.js',function(req,res)
{
	//res.send('<h1>Hello world</h1>');
	res.sendFile(__dirname+'/app.js');
});

http.listen(PORT,function(){console.log("INIT OK!")})

setInterval(refreshData,3000);


// express()
//   .use(express.static(path.join(__dirname, 'public')))
//   .set('views', path.join(__dirname, 'views'))
//   .set('view engine', 'ejs')
//   .get('/', (req, res) => res.render('pages/index'))
//   .listen(PORT, () => console.log(`Listening on ${ PORT }`))




