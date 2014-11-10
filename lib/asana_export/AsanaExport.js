var ae = require("./");

var AsanaExport = module.exports = ae.aei.Export.extend().newSlots({
	db: null
}).setSlots({
	init: function() {
		this.setDb(ae.AsanaExportDb.clone());
	},

	prepareForImport: function() {
		this.processExportFile();
	},

	processExportFile: function() {
		if (this.db().exists()) {
			return;
		} else {
			this.db().create();
		}

		var i = 0;

		var lineReader = ae.LineReader.clone().setPath(this.path());
		var line = null;
		while(line = lineReader.readLine()) {
			this.db().insert(line); //If you comment this out, the LineReader processes all lines
			console.log("Read line " + (++ i));
		}
	},

	teams: function() {
		return this.db().findByTypeLike("Team").map(function(obj){
			return ae.aei.Team.clone().performSets({
				sourceId: obj.__object_id,
				name: obj.name,
				teamType: obj.team_type
			});
		});
	},

	projects: function() {
		return this.db().findByTypeLike("ItemList").map(function(obj){
			if (obj.is_project) {
				return ae.aei.Project.clone().performSets({
					sourceId: obj.__object_id,
					sourceTeamId: obj.team,
					archived: obj.archived,
					name: obj.name,
					color: obj.color,
					notes: obj.notes
				});
			}
		}).emptiesRemoved();
	},

	taskCursorDataSource: function() {
		var self = this;
		return function(position, chunkSize) {
			return self.db().findByTypeLike("Task", position, chunkSize).map(function(obj){
				return ae.aei.Task.clone().performSets({
					sourceId: obj.__object_id,
					assigneeStatus: obj.assignee_status,
					completed: obj.completed !== undefined,
					dueOn: obj.due_on,
					hearted: obj.hearted,
					name: obj.name,
					notes: obj.notes,
					sourceProjectIds: self.db().findParentsByType(obj.__object_id, "ItemList").filterProperty("is_project", true).mapProperty("__object_id"),
					sourceParentId: self.db().findParentsByType(obj.__object_id, "Task").mapProperty("__object_id").first()
				});
			});
		}
	},

	storyCursorDataSource: function() {
		var self = this;
		return function(position, chunkSize) {
			return self.db().findByTypesLike(["Comment", "Story"], position, chunkSize).map(function(obj){
				return ae.aei.Story.clone().performSets({
					sourceId: obj.__object_id,
					text: obj.text,
					sourceParentId: self.db().findParentsByType(obj.__object_id, "Task").mapProperty("__object_id").first()
				});
			});
		}
	},

	attachmentCursorDataSource: function() {
		var self = this;
		return function(position, chunkSize) {
			return self.db().findByTypeLike(["Asset"], position, chunkSize).map(function(obj){
				return ae.aei.Attachment.clone().performSets({
					sourceId: obj.__object_id,
					sourceParentId: self.db().findParentsByType(obj.__object_id, "Task").mapProperty("__object_id").first()
				});
			});
		}
	}
});