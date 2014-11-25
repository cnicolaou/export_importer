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

// this method can iterate over an iterable (similar to ES6 iterables) in parallel
var Iterable_forEachParallel = exports.Iterable_forEachParallel = function(callback, thisArg, parallelism) {
	var self = this;
	var iterator = this.iterator();
	var index = 0;
	var error;

	var futures = [];
	function next() {
		var currentIndex = index++;
		try	{
			var currentValue = iterator.next();
		} catch (e) {
			if (e === "StopIteration") {
				return;
			} else {
				throw e;
			}
		}
		var future = aei.Future.task(function() {
			callback.call(thisArg, currentValue, currentIndex, self);
		});
		future.resolve(function(e, result) {
			futures.splice(futures.indexOf(future), 1);
			if (e) {
				if (error === undefined) {
					error = e;
				}
			} else {
				next();
			}
		});
		futures.push(future);
	}

	if (this.length) {
		var fiberCount = Math.min(this.length, parallelism || Infinity);
	} else {
		var fiberCount = parallelism || 100;
	}
	for (var i = 0; i < fiberCount; i++) {
		next();
	}

	while (futures.length > 0) {
		aei.Future.wait(futures);
	}

	if (error !== undefined) {
		throw error;
	}
};

Array.prototype.iterator = function() {
	var array = this;
	var index = 0;
	return {
		next: function() {
			if (index >= array.length) {
				throw "StopIteration";
			}
			return array[index++];
		}
	};
};

Array.prototype.forEachParallel = Iterable_forEachParallel;

Array.prototype.mapParallel = function(callback, thisArg, parallelism) {
	var result = [];
	this.forEachParallel(function(currentValue, index, array) {
		result[index] = callback(currentValue, index, array);
	}, thisArg, parallelism);
	return result;
}
