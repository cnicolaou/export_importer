var aei = require("./");

aei.Future.withPromise = function(promise) {
	var future = new aei.Future;
	promise.then(function(result){
		future.return(result);
	});
	promise.catch(function(e){
		if (e) {
			console.log(e.value.errors);
		}
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

Array.prototype.forEachParallel = function(callback, thisArg) {
	var error;
	var futures = this.map(function(currentValue, index, array) {
		return aei.Future.task(function() {
			try {
				callback(currentValue, index, array);
			} catch (e) {
				if (error === undefined) {
					error = e;
				}
			}
		});
	}, thisArg);

	aei.Future.wait(futures);
	if (error !== undefined) {
		throw error;
	}
}

Array.prototype.mapParallel = function(callback, thisArg) {
	var result = [];
	this.forEachParallel(function(currentValue, index, array) {
		result[index] = callback(currentValue, index, array);
	}, thisArg);
	return result;
}
