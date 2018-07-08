// MODULE
var formulario = angular.module('formulario',['ngAria','ngMaterial', 'ngMessages' ,'chart.js','md.time.picker']);

formulario.controller('formController', function ($scope, $window, $mdDialog,$timeout,$http,$mdpTimePicker) {


	//------------------------------------------------------------------------------------------------------
	//---VARIABLES GENERALES--------------------------------------------------------------------------------
	//------------------------------------------------------------------------------------------------------

	$scope.routes;// this variable contains the route objects obtained from the database.
	$scope.routesReady = false; // this variable will tell if the routes data has been succesfully loaded.

	$scope.daysOfTheWeek = ['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'];
	$scope.monthsOfTheYear = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
	$scope.turnos = ['Primer Turno', 'Segundo Turno', 'Tercer turno'];

	//---VARIABLES FROM GRAPHS------------------------------------------------------------------------------

	$scope.fechaFinal = new Date();
	$scope.fechaInicial = new Date($scope.fechaFinal.getTime()-(24*60*60*1000*7));
	$scope.lapCounterGraphs = [];

	$scope.i = 0;
	$scope.j = 0;

	//------------------------------------------------------------------------------------------------------
	//---PREPARACIONES GENERALES ---------------------------------------------------------------------------
	//------------------------------------------------------------------------------------------------------

	$scope.getRutas = function(){

		$http({
			method: 'GET',
			url:'http://localhost:5001/getRutas'
		}).then(function successCallback(response){
			console.log("llamada exitosa de rutas en tuggers ->",response.data);

			response.data.resultado.forEach(function(xRoute,xIndex,xArray){
				$scope.createCounterGraph(xRoute,xIndex,$scope.fechaInicial,$scope.fechaFinal);
			});

			console.log("$scope.lapCounterGraphs",$scope.lapCounterGraphs);

		}, function errorCallback(response){
			console.log("llamada no exitosa",response);
		});
	}
	

	$scope.createCounterGraph = function(oneRoute,graphIndex,initialDate,finishingDate){
		/*Remember that from the database is comming an object with an status code of good of bad request 
		and the array result of th query.*/

		/*Here we'll take the _oneRoute object and then we'll take from it the marj and the mino of the route.
		now we need to make a query to the database in order to get all the laps that correspond to that route
		For that we need to create a query object
			-	mino
			-	marj
			-	from date
			-	to date
		*/

		/*This particular function is not going to return anything, since it will work with a lot of asynchronous 
		calls, instead of trying to link a return result to the appropiated part, we will give the final object
		as target of the function.*/

		//We initialize the finishing date as the current day
		var _finishingDate = new Date();
		//But if we recieved a finishingDate we'll asign it
		if(finishingDate)
			_finishingDate = finishingDate;

		//We'll initialize the initial date as 7 days ago from the finishing date
		var _initialDate = new Date(_finishingDate.getTime()-(7*86400000));
		//But if we recieved an initial date we'll asign it
		if(initialDate)
			_initialDate = initialDate;

		//We calc the absolute time period.
		var absolutePeriod = _finishingDate.getTime()-_initialDate.getTime();
		//We calc how many days we'll display, we use a ceil round up. 
		var noDays = Math.ceil(absolutePeriod/(24*60*60*1000));
		console.log(absolutePeriod);

		//An empty object is created in order to store all the data.
		if(!$scope.lapCounterGraphs[graphIndex])
			$scope.lapCounterGraphs[graphIndex] = {};
		//We need a labels array that will be the titles of the different bars in the graph
		if(!$scope.lapCounterGraphs[graphIndex].labels){
			$scope.lapCounterGraphs[graphIndex].labels = [];
		}else{
			if($scope.lapCounterGraphs[graphIndex].labels.length>noDays){
				while($scope.lapCounterGraphs[graphIndex].labels.length != noDays){
					$scope.lapCounterGraphs[graphIndex].labels.pop();
				}
			}
		}
		//We need the series name in this case those series are the shifts.
		$scope.lapCounterGraphs[graphIndex].series = $scope.turnos;
		/*Finally we need all the data ordered in an array of arrays, each array will have the same amount of 
		elements as labels, and we only need 3 arrays since there are only 3 shifts.*/
		if(!$scope.lapCounterGraphs[graphIndex].data)
			$scope.lapCounterGraphs[graphIndex].data = [];

		$scope.lapCounterGraphs[graphIndex].graphTitle = "Vueltas por día"
		$scope.lapCounterGraphs[graphIndex].routeName = oneRoute.nombre;

		/*This function helps creating the query object needed to search in the data base.*/
		var makeRouteTimeQuery = function(_oneRoute, initDate, endDate){

			console.log("initDate",initDate);
			console.log("endDate",endDate);

			var _query = {};

			//we create the end date to make the query with the current day.
			var _endDate = new Date();

			// If the end data is given to the function then we asign it
			if(endDate)
				_endDate = endDate;

			//If there is no initial date we look for the full past week starting from the end date
			var _initDate = new Date(_endDate.getTime()-(7*24*60*60*1000));

			//Just like the finishing date, if there is an initial date given to the function  we'll asign it
			if(initDate)
				_initDate = initDate;

			//Once the limits of this search are given we create the query object
			_query = {};
			_query.routeMarj = _oneRoute.marj;
			_query.routeMino = _oneRoute.mino;


			let lastBeacon = _oneRoute.beacons[_oneRoute.beacons.length-1];
			lastBeacon = lastBeacon+".rawMainTime";
			
			_query[lastBeacon] = {};
			_query[lastBeacon].$gte = _initDate.getTime();

			_query[lastBeacon].$lt = _endDate.getTime();
			
			console.log("QUERY IS: ",_query)
			console.log("initial time", _initDate);
			console.log("finishing time", _endDate);

			return _query;
		}

		

		//If there is more than one day of difference we'll show different days.
		//if(absolutePeriod>(24*60*60*1000)){
		if(true){

			console.log("noDays",noDays);

			/*Now for each day */
			for(var i = 0;i<3;i++){

				/*now we create an array in in the data array*/
				if(!$scope.lapCounterGraphs[graphIndex].data[i])
					$scope.lapCounterGraphs[graphIndex].data[i] = [];

				for(var j = 0;j <= noDays;j++){

					let cicleDate = new Date(_initialDate.getTime()+(j*24*60*60*1000));
					//We get the day of the week from the current day of the for.
					let dotw = (cicleDate.getDay());
					let fecha = "\n"+cicleDate.getDate()+"/"+$scope.monthsOfTheYear[cicleDate.getMonth()];
					//new we start pushing the labels of the data into the graph.
					$scope.lapCounterGraphs[graphIndex].labels[j] = ($scope.daysOfTheWeek[dotw]+fecha);


					console.log("$scope.daysOfTheWeek",$scope.daysOfTheWeek);
					console.log("$scope.lapCounterGraphs[graphIndex].labels",$scope.lapCounterGraphs[graphIndex].labels);
					console.log("dotw",dotw);

					/*now we calculate the range of dates for the query. */
					let myStartingDate = new Date(_initialDate.getTime()+(60*60*7*1000)+(24*60*60*1000*j));
					let myFinishingDate = new Date(myStartingDate.getTime()+(60*60*8*1000*(i+1)));

					let mongoQuery = makeRouteTimeQuery(oneRoute,myStartingDate,myFinishingDate);
					let collection = "Laps";

					let mongoQueryString = JSON.stringify(mongoQuery);
					
					let _i = i;
					let _j = j;

					$http({
						method: 'GET',
						url:'http://localhost:5001/makeQuery?mongoQuery='+mongoQueryString+'&collection='+collection
					}).then(function successCallback(response){
						console.log("llamada exitosa");//,response.data.resultado[0]);

						if(response.data.mongoResult){
							console.log("graphIndex",graphIndex);
							console.log("i",_i);
							console.log("j",_j);

							$scope.i = _i;
							$scope.j = _j;

							$scope.lapCounterGraphs[graphIndex].data[_i][_j] = response.data.mongoResult.length;

							console.log("$scope.lapCounterGraphs",$scope.lapCounterGraphs);
						}else{
							$scope.lapCounterGraphs[graphIndex].data[_i][_j] = 0;
						}
					}, function errorCallback(response){
						console.log("llamada no exitosa",response);
					});
				}
			}
		}
	}

	//------------------------------------------------------------------------------------------------------
	//--- CALLBACKS FROM FRONT END -------------------------------------------------------------------------
	//------------------------------------------------------------------------------------------------------

	$scope.changeOfDate = function(){
		$scope.fechaFinal.setHours(0);
		$scope.fechaFinal.setMinutes(0);
		$scope.fechaFinal.setSeconds(0);

		$scope.fechaInicial.setHours(0);
		$scope.fechaInicial.setMinutes(0);
		$scope.fechaInicial.setSeconds(0);

		if($scope.fechaInicial.getTime()> $scope.fechaFinal.getTime()){
			$scope.fechaFinal = $scope.fechaInicial;
			alert("La fecha inicial no puede ser posterior a la fecha final!");
		}
		
		console.log("$scope.fechaFinal",$scope.fechaFinal);
		console.log("$scope.fechaInicial",$scope.fechaInicial);
		console.log("diferencia entre días:",($scope.fechaFinal.getTime()-$scope.fechaInicial.getTime())/(24*60*60*1000));
		$scope.getRutas();
	}

	$scope.nextTab = function()
	{
		$window.scrollTo(0, 0);
		$scope.tabIndex = $scope.tabIndex +1;
	}

	//------------------------------------------------------------------------------------------------------
	//--- MAIN CODE ----------------------------------------------------------------------------------------
	//------------------------------------------------------------------------------------------------------
	
	$scope.getRutas();

	$scope.labels = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado','Domingo'];
	
	$scope.data = [
	[65, 59, 80, 81, 56, 40],
	[45, 39, 60, 51, 26, 44],
	[28, 48, 40, 19, 86, 90]
	];

	$scope.xmlHttp = new XMLHttpRequest();


	$scope.tabIndex;

	$scope.records = ["hola","adios","hello","goodbye"];

	

	// $http({
	// 	method: 'GET',
	// 	url:'http://localhost:5001/demoMongo'
	// }).then(function successCallback(response){
	// 	console.log("llamada exitosa",response.data.resultado[0]);
	// }, function errorCallback(response){
	// 	console.log("llamada no exitosa",response);
	// });


	$scope.socket = io();

	$scope.socket.on('newData',function(msg){

		$scope.getRutas();

		console.log("NEW DATA",msg["000F17C1"]);

		$scope.labels = [];
		$scope.series = ["Ruta unica"];
		$scope.data = [[]];

		Object.keys(msg["000F17C1"].allData.routeStatsDeviceObjects).forEach(function(beaconInRoute,index,arr){

			
			$scope.labels.push(beaconInRoute)
			$scope.data[0].push(msg["000F17C1"].allData[beaconInRoute].average);

			// console.log("$scope.data",$scope.data);
			// console.log("$scope.labels",$scope.labels);
			// console.log("$scope.series",$scope.series);

			if(index == arr.length-1){
				$scope.$apply(function(){
					$scope.labels.push(beaconInRoute)
					$scope.data[0].push(msg["000F17C1"].allData[beaconInRoute].average);
				});	
			}

		});

	});
	
});




