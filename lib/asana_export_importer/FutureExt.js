var Future = require('fibers/future');

Future.withPromise = function(promise) {
	var future = new Future;
	promise.then(function(result){
		future.return(result);
	});
	promise.error(function(e){
		future.throw(e);
	});
	return future;
}