// MODULE
var formulario = angular.module('formulario',['ngAria','ngMaterial', 'ngMessages' ,'chart.js','md.time.picker']);

formulario.controller('formController', function ($scope, $window, $mdDialog,$timeout,$http,$mdpTimePicker) {


	//------------------------------------------------------------------------------------------------------
	//---VARIABLES GENERALES--------------------------------------------------------------------------------
	//------------------------------------------------------------------------------------------------------

	$scope.routes;// this variable contains the route objects obtained from the database.
	$scope.routesReady = false; // this variable will tell if the routes data has been succesfully loaded.

	//---VARIABLES FROM GRAPHS------------------------------------------------------------------------------


	
	$scope.labels = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
	$scope.series = ['Primer Turno', 'Segundo Turno', 'Tercer turno'];

	$scope.data = [
	[65, 59, 80, 81, 56, 40],
	[45, 39, 60, 51, 26, 44],
	[28, 48, 40, 19, 86, 90]
	];

	$scope.xmlHttp = new XMLHttpRequest();


	$scope.tabIndex;

	$scope.records = ["hola","adios","hello","goodbye"];

	$scope.nextTab = function()
	{
		$window.scrollTo(0, 0);
		$scope.tabIndex = $scope.tabIndex +1;
	}

	$http({
		method: 'GET',
		url:'http://localhost:5001/demoMongo'
	}).then(function successCallback(response){
		console.log("llamada exitosa",response.data.resultado[0]);
	}, function errorCallback(response){
		console.log("llamada no exitosa",response);
	});


	$scope.socket = io();

	$scope.socket.on('newData',function(msg){

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




