var aei = require("./");

var MockExportData = aei.ideal.Proto.extend().setType("Cursor").newSlots({
	users: [],
	teams: [],
	projects: [],
	tags: [],
	tasks: [],
	stories: [],
	attachments: []
});

var MockExport = module.exports =  aei.Export.extend().newSlots({
	data: null,
}).setSlots({
	init: function() {
		this.setData(MockExportData.clone());
	},

	prepareForImport: function() {
	},

	users: function() {
		return this.data().users().map(function(user) {
			return aei.User.clone().performSets(user)
		});
	},

	teams: function() {
		return this.data().teams().map(function(team) {
			return aei.Team.clone().performSets(team)
		});
	},

	projects: function() {
		return this.data().projects().map(function(project) {
			return aei.Project.clone().performSets(project);
		});
	},

	tags: function() {
		return this.data().tags().map(function(project) {
			return aei.Tag.clone().performSets(project);
		});
	},

	taskCursorDataSource: function() {
		var self = this;
		return function(position, chunkSize) {
			return self.data().tasks().slice(position, position + chunkSize).map(function(task) {
				return aei.Task.clone().performSets(task);
			});
		};
	},

	storyCursorDataSource: function() {
		var self = this;
		return function(position, chunkSize) {
			return self.data().stories().slice(position, position + chunkSize).map(function(task) {
				return aei.Story.clone().performSets(task);
			});
		};
	},

	attachmentCursorDataSource: function() {
		var self = this;
		return function(position, chunkSize) {
			return self.data().attachments().slice(position, position + chunkSize).map(function(task) {
				return aei.Attachment.clone().performSets(task);
			});
		};
	}
});
