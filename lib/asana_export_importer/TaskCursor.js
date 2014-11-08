var aei = require("./");

var TaskCursor = module.exports = aei.ideal.Proto.extend().newSlots({
	chunkSize: 100,
	dataSource: null
}).setSlots({
	init: function() {
		this.reset();
	},

	position: function() {
		return this._chunkPosition - this._chunk.length;
	},

	//returns a task
	next: function() {
		if (this._chunk.length == 0) {
			this._chunk = this.dataSource().nextChunk(this._chunkPosition, this.chunkSize());
			this._chunkPosition += this._chunk.length;
		}
		return this._chunk.shift();
	},

	eachBatch: function(batchSize, fn) {
		var batch = [];
		var task;

		while (task = this.next()) {
			batch.push(task);
			if (batch.length == batchSize) {
				fn(batch);
				batch = [];
			}
		}

		if (batch.length > 0) {
			fn(batch);
		}
	},

	reset: function() {
		this._chunk = [];
		this._chunkPosition = 0;
		return this;
	}
});