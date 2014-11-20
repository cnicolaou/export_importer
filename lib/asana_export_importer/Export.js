var aei = require("./");

var Export = module.exports = aei.ideal.Proto.extend().setType("Export").newSlots({
	path: null
}).setSlots({
	prepareForImport: function() {
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

	taskCursor: function() {
		if (!this._taskCursor) {
			this._taskCursor = aei.Cursor.clone().setDataSource(this.taskCursorDataSource());
		}

		return this._taskCursor;
	},

	storyCursor: function() {
		if (!this._storyCursor) {
			this._storyCursor = aei.Cursor.clone().setDataSource(this.storyCursorDataSource());
		}

		return this._storyCursor;
	},

	attachmentCursor: function() {
		if (!this._attachmentCursor) {
			this._attachmentCursor = aei.Cursor.clone().setDataSource(this.attachmentCursorDataSource());
		}

		return this._attachmentCursor;
	},

	taskCursorDataSource: function() {
		throw "Clones should return a function with the following signature: function(position, chunkSize) returns [aei.Task, ...]";
	},

	storyCursorDataSource: function() {
		throw "Clones should return a function with the following signature: function(position, chunkSize) returns [aei.Story, ...]";
	},

	attachmentCursorDataSource: function() {
		throw "Clones should return a function with the following signature: function(position, chunkSize) returns [aei.Attachment, ...]";
	}
});