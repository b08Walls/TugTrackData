

var newTest = function(){

	var x = 0;

	var cuenta = function(){
		x++;
		return x;
	}

	return {
		cuenta:cuenta
	};
}


var test = newTest();

console.log(test.cuenta());
console.log(test.cuenta());
console.log(test.cuenta());
console.log(test.cuenta());
console.log(test.cuenta());