var aei = require("./");

var Export = module.exports = aei.ideal.Proto.extend().setType("Export").newSlots({
	path: null
}).setSlots({
	prepareForImport: function() {
		throw "Clones should override";
	},

	cleanupAfterImport: function() {
		throw "Clones should override";
	},

	users: function() {
		throw "Clones should override";
	},

	teams: function() {
		throw "Clones should override";
	},

	projects: function() {
		throw "Clones should override";
	},

	tags: function() {
		throw "Clones should override";
	},

	taskIterable: function() {
		if (!this._taskIterable) {
			this._taskIterable = aei.BatchIterable.clone().setDataSource(this.taskDataSource());
		}

		return this._taskIterable;
	},

	attachmentIterable: function() {
		if (!this._attachmentIterable) {
			this._attachmentIterable = aei.BatchIterable.clone().setDataSource(this.attachmentDataSource());
		}

		return this._attachmentIterable;
	},

	taskDataSource: function() {
		throw "Clones should return a function with the following signature: function(position, chunkSize) returns [aei.Task, ...]";
	},

	attachmentDataSource: function() {
		throw "Clones should return a function with the following signature: function(position, chunkSize) returns [aei.Attachment, ...]";
	}
});
