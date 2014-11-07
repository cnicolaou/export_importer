var aei = require("./");

var TaskCursor = module.exports = aei.ideal.Proto.extend().newSlots({
	chunkSize: 100,
	dataSource: null
}).setSlots({
	init: function() {
		this._chunk = [];
		this._chunkPosition = 0;
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
	}
});