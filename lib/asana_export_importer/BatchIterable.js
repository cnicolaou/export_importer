var aei = require("./");
var FutureExt = require("./FutureExt");

var BatchIterable = module.exports = aei.ideal.Proto.extend().setType("BatchIterable").newSlots({
	chunkSize: 100,
	dataSource: null
}).setSlots({
	iterator: function() {
		var self = this;
		var chunkPosition = 0;
		var chunk = [];
		var stopped = false;
		return {
			next: Synchronized(function() {
				if (chunk.length === 0 && !stopped) {
					chunk = self._dataSource(chunkPosition, self.chunkSize());
					chunkPosition += chunk.length;
				}
				if (chunk.length === 0) {
					stopped = true;
					throw "StopIteration";
				}
				return chunk.shift();
			})
		}
	},

	forEachParallel: FutureExt.Iterable_forEachParallel
});

function Lock() {
	this.futures = [];
}
Lock.prototype.enter = function() {
	this.futures.push(new aei.Future);
	if (this.futures.length > 1) {
		this.futures[this.futures.length - 2].wait();
	}
}
Lock.prototype.exit = function() {
	var future = this.futures.shift();
	process.nextTick(future.return.bind(future));
}

function Synchronized(func) {
	var lock = new Lock;
	return function() {
		lock.enter();
		try {
			return func.apply(this, arguments);
		} finally {
			lock.exit();
		}
	}
}
