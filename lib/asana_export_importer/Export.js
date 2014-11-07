var aei = require("./");

var Export = module.exports = aei.ideal.Proto.extend().newSlots({
	path: null
}).setSlots({
	prepareForImport: function() {
		throw "Clones should override";
	},

	teams: function() {
		throw "Clones should override";
	},

	taskCursor: function() {
		if (!this._taskCursor) {
			this._taskCursor = aei.TaskCursor.clone().setDataSource(this.taskCursorDataSource());
		}

		return this._taskCursor;
	},

	taskCursorDataSource: function() {
		throw "Clones should return an object with the following method: nextChunk(position, chunkSize) returns [aei.Task, ...]";
	}
});