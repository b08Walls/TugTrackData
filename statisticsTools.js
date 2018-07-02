

/*Como notas cada que se agregue una muestra sera necesario que:
	->	se agreguen los valores de la muestra a la suma total de muestras
	-> 	se calcule el máximo y el minimo
	->	se calcule el promedio
	->	se sume el cuadrado de la diferencia de la nueva muestra y el promedio a standarDeviationSumatory
	->	se calcule la desviación estandar.*/

var newStatsDeviceObject = function(_routeName,_chipid){

	/*The following list of varibles contains all the diferent values that are stored by the object*/
	var samples = [];

	var chipid = _chipid;//chipid to know who is this statsObject from
	var routeName = _routeName;//route who it belongs

	var absoluteTime = 0//summation of all times ever sampled since the object was created
	var samplesNumber = 0;//number of taken samples since the object was created
	var nullSamplesNumber = 0;//number of taken null samples since the object was created

	var maxSample;//highest value ever registered since the object was created
	var minSample;//lowes value ever registered since the object was created

	var average = 0;//average of all the values
	var varianceSumatory = 0;//sumatory of the squared differences between the average and all the samples.
	var standarDeviation = 0;//standar deviation of the sample

	/*This values are used to check any value that has an strange behavior.*/
	var upperLimit = 0;//upperLimit = average + 3 * standarDeviation
	var lowerLimit = 0;//lowerLimit = average - 3 * standarDeviation

	/*All the folowing functions are quite simple they do what their names say they do.*/
	var getAverage = function(){
		average = absoluteTime/samplesNumber;
		return average;
	}

	var getDeviceEficiency = function(){
		deviceEficiency = (samplesNumber/(samplesNumber+nullSamplesNumber));
		return deviceEficiency;
	}

	var getStandarDeviation = function(){
		standarDeviation = Math.sqrt(varianceSumatory/(samplesNumber-1));
		return standarDeviation;
	}

	/*This function will be use to add samples to the object*/
	var addSample = function(sample){
		
		//First we check if there is a value to add or is a null value
		if(!sample){
			//if there is no value we only increase the number of null samples
			nullSamplesNumber++;
			return;//and return
		}

		//if there is no maxSample or minSample defined we define the current value
		if(!maxSample) maxSample = sample;	
		if(!minSample) minSample = sample;

		//With these two lines we asign the max and min sample if it's needed
		maxSample = sample>maxSample ? sample : maxSample;
		minSample = sample<minSample ? sample : minSample;

		samples.push(sample);
		//We increase the absolute time
		absoluteTime = samples.reduce(function(total,num){
			return total+num;
		});
		//We increase the samples number
		samplesNumber = samples.length;
		//We calc the new average value
		getAverage();
		//With the new average value we calc the varianceSumatory
		varianceSumatory = samples.reduce(function(total,num){
			return total + (Math.pow(num-average),2);
		})
		//standarDeviation
		getStandarDeviation();	
		//and we also calc the deviceEficiency
		getDeviceEficiency();

		//Finally we set the new upperLimit and lowerLimit
		upperLimit = average+(3*standarDeviation);
		lowerLimit = average-(3*standarDeviation);
	}

	var checkSample = function(sample){
		let _res = sample>upperLimit ? false : (sample<lowerLimit ? false : true);
		return _res;
	}


	var getAllData = function(){

		let limits = {upperLimit:upperLimit,
					  lowerLimit:lowerLimit};

		let _res = {};

		_res.limits = limits;
		_res.average = average;
		_res.standarDeviation = standarDeviation;
		_res.deviceEficiency = deviceEficiency;

		return _res;
	}

	var _objeto = {
		getAllData:getAllData,
		addSample:addSample
	};


	return _objeto;
}

/*El objeto de ruta debera recibir un objeto de ruta y bucar los tiempos promedio de las rutas.*/
var newRouteDeviceObject = function(route){

	var _route = route;
	var _routeStatsDeviceObjects = {};
	var _lapTimes = [];

	var absoluteTime = 0//summation of all times ever sampled since the object was created
	var samplesNumber = 0;//number of taken samples since the object was created

	var maxSample;//highest value ever registered since the object was created
	var minSample;//lowes value ever registered since the object was created

	var average = 0;//average of all the values
	var varianceSumatory = 0;//sumatory of the squared differences between the average and all the samples.
	var standarDeviation = 0;//standar deviation of the sample

	/*This values are used to check any value that has an strange behavior.*/
	var upperLimit = 0;//upperLimit = average + 3 * standarDeviation
	var lowerLimit = 0;//lowerLimit = average - 3 * standarDeviation


	_route.beacons.forEach(function(beacon){
		_routeStatsDeviceObjects[beacon] = newStatsDeviceObject(_route.nombre,route);
	});

	/*All the folowing functions are quite simple they do what their names say they do.*/
	var getAverage = function(){
		average = absoluteTime/samplesNumber;
		return average;
	}

	var getStandarDeviation = function(){
		standarDeviation = Math.sqrt(varianceSumatory/(samplesNumber-1));
		return standarDeviation;
	}

	var addLap = function(lap){

		/*	When a new lap is added to the routeDeviceObject the first thing we do is check that the object with index 1
			actually exist in the array, since this object is the general reference time used for all statistics calcs we 
			need to discard all the laps without this object.*/
		if(lap[_route.beacons[1]]){
			/*	If this object exist then we start to travel by all the different beacons in the route in order to get the data
				that we need*/
			_route.beacons.forEach(function(beacon,index,array){
				/*	We use a try/catch block since there can be some data missing beacuse of the hardware and there are 
				to many conditions to check, so it's easier this try/catch block.*/
				try{

					//We locate de actual beacon we are calculating
					let actual = beacon;
					//We check if there is a future one
					let future = array[index+1];

					//now go for the times.
					let actualTime = lap[actual].rawMainTime;
					let futureTime = lap[future].rawMainTime;

					//if everything is defined we'll be able to add a sample to the statsDeviceObject
					//console.log("SE HA AGREGADO "+actualTime+" EN BEACON: ",actual);
					_routeStatsDeviceObjects[actual].addSample(futureTime-actualTime);
				}catch(err){
					//In case of any error the error will be reported in console and also we'll add a null sample.
					//console.log(err);
					let actual = beacon;
					//console.log("SE HA AGREGADO NULL EN BEACON: ",actual);
					_routeStatsDeviceObjects[actual].addSample(null);
				}

				if(lap[_route.beacons[_route.beacons.length-1]]){

					let _lapTime =lap[_route.beacons[_route.beacons.length-1]].rawMainTime - lap[_route.beacons[1]].rawMainTime;

					_lapTimes.push(_lapTime);

					if(!maxSample) maxSample = _lapTime;
					if(!minSample) minSample = _lapTime;

					maxSample = _lapTime>maxSample ? _lapTime : maxSample;
					minSample = _lapTime<minSample ? _lapTime : minSample;

					//We increase the absolute time
					absoluteTime = _lapTimes.reduce(function(total,num){
						return total+num;
					});
					//We increase the samples number
					samplesNumber = _lapTimes.length;
					//We calc the new average value
					getAverage();
					//With the new average value we calc the varianceSumatory
					varianceSumatory = _lapTimes.reduce(function(total,num){
						return total + (Math.pow(num-average),2);
					})
					//standarDeviation
					getStandarDeviation();	

					//Finally we set the new upperLimit and lowerLimit
					upperLimit = average+(3*standarDeviation);
					lowerLimit = average-(3*standarDeviation);
				}//ends the if that checks all the values.
			});//ends for each that visits every beacon and checks all the stats
		}//ends lap validation with first element in route
	}//Ends "addLap"


	var getAllData = function(){

		let limits = {upperLimit:upperLimit,
					  lowerLimit:lowerLimit};

		let _res = {};

		Object.keys(_routeStatsDeviceObjects).forEach(function(key){

			_res[key] = _routeStatsDeviceObjects[key].getAllData();
		})

		_res.limits = limits;
		_res.average = average;
		_res.standarDeviation = standarDeviation;
		_res.routeStatsDeviceObjects = _routeStatsDeviceObjects;
		_res.beacons = _route.beacons;

		return _res;
	}

	return {
		getAllData:getAllData,
		addLap:addLap,
		route,_route
	}
}

statisticTools = {
	newStatsDeviceObject:newStatsDeviceObject,
	newRouteDeviceObject:newRouteDeviceObject
};

module.exports = statisticTools;

