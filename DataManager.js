var MongoClient = require('mongodb').MongoClient;//this creates a mongo client to make queries to the database.
var url = 'mongodb://localhost:27017';//This is the connection URL.

var newDataManager = function(){

	var newFrequencyData = function(data,startDate, finishDate){

		var daysOfTheWeek = ['none','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'];
		var monthsOfTheYear = ['none','Enero','Febrer','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
		var moty = ['n','ENE','FEB','MAR','ABR','MAY','JUL','JUN','AGO','SEP','OCT','NOV','DIC'];

		//----SECCION ENCARGADA DE GENERAR LAS ETIQUETAS DE LOS VALORES

		if(!startDate)
			startDate = new Date();

		if(!finishDate)
			finishDate = new Date(startDate.getTime()+(7*86400000));

		var startVal = startDate.getTime();
		var finishVal = finishDate.getTime();

		labels = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
		series = ['Primer Turno', 'Segundo Turno', 'Tercer turno'];

		/*Lo que se necesita hacer es solciitar a partir de la fecha de inicio, todos 
		aquellos valores correspondientes a una fecha y correspondientes a un turno*/

		var queries = [];

		

		data = [
		[65, 59, 80, 81, 56, 40],
		[45, 39, 60, 51, 26, 44],
		[28, 48, 40, 19, 86, 90]
		];

		MongoClient.connect(url, function(err, db) {
			//Quite simple, if there is something wrong, throw an exception.
			if (err) throw err;

			// we declare the name of the database
			var dbo = db.db("mydb");

			// an empty object is create to make the query
			var query = {};

			dbo.collection("Laps").find(query).toArray(function(err,result){
				if(err) throw err;

				console.log(result[0]["16639475"].mainTime);
				console.log(typeof(result[0]["16639475"].mainTime.getDay()));
				console.log(result[0]["16639475"].mainTime.getDay());



				db.close();
			});//End of "find" callback

		});//End of "on-connect" callback

	}

}