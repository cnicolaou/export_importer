var aei = require("./");

aei.Future.withPromise = function(promise) {
	var future = new aei.Future;
	promise.then(function(result){
		future.return(result);
	});
	promise.error(function(e){
		console.log(e.value.errors);
		future.throw(e);
	});
	return future;
}

Function.prototype.futureWrap = function() {
	return aei.Future.wrap(this);
}

/*
blockForCallback = function(fn) {
	return Future.wrap(function(callback) {
		fn(callback);
	})().wait();
};
*/