var aei = require("./");

var FuturesBatch = module.exports = aei.ideal.Proto.extend().setType("FuturesBatch").newSlots({
	batchSize: 100
}).setSlots({
	init: function() {
		this._batch = [];
	},

	add: function(future) {
		this._batch.push(future);
		if (this._batch.length == this.batchSize) {
			this.wait();
		}
	},

	wait: function() {
		this._batch.forEachPerform("wait");
		this._batch = [];
	}
});
