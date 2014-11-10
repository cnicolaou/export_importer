var aei = require("./");

var LineByLineReader = require('line-by-line');

var Importer = module.exports = aei.ideal.Proto.extend().setType("Importer").newSlots({
	organizationId: 8737056890891,
	export: null,
	batchSize: 100
}).setSlots({
	run: function() {
		this.export().prepareForImport();
		this._runImport();
	},

	_runImport: function() {
		this._sourceToAsanaIdMap = {};

		this._importTeams();
		this._importProjects();
		this._importTasks();
		this._importSubtasks();
		this._importStories();
		this._importAttachments();
	},

	_removeTeams: function() {
		//sapi --method=POST '/teams/1097/addUser' '{"data":{"user":"1110"}}' | json_pp
		//sapi --method=POST '/teams/1097/removeUser' '{"data":{"user":"1110"}}' | json_pp
	},

	_importTeams: function() {
		var self = this;
		console.log("importing teams ...");
		this._teams = this.export().teams().forEachPerform("setOrganizationId", this.organizationId()).mapPerform("create").map(function(future, i){
			var team = future.wait();
			console.log("imported " + (i + 1) + " teams");
			return team;
		});
		console.log("imported all teams.\n");
	},

	_importProjects: function() {
		var self = this;
		console.log("importing projects ...");
		this._projects = this.export().projects().filter(function(project){
			project.setWorkspaceId(self.organizationId());
			project.setTeam(self._teams.detectSlot("sourceId", project.sourceTeamId()));
			return project.team();
		}).emptiesRemoved().mapPerform("create").map(function(future, i){
			var project = future.wait();
			console.log("imported " + (i + 1) + " projects");
			return project;
		});
		console.log("imported all projects.\n");
	},

	_importTasks: function() {
		var self = this;
		this._importFromCursor(this.export().taskCursor(), "tasks", function(task){
			return task.performSets({
				workspaceId: self.organizationId(),
				projects: self._projects.filter(function(project){
					return task.sourceProjectIds().contains(project.sourceId());
				})
			}).create();
		});
	},

	_importSubtasks: function() {
		var self = this;
		this._importFromCursor(this.export().taskCursor().reset(), "subtasks", function(task){
			task.setAsanaId(self._asanaIdForSourceId(task.sourceId()));
			var asanaParentId = self._asanaIdForSourceId(task.sourceParentId());
			if (asanaParentId !== null) {
				return task.updateParentId(asanaParentId);
			} else {
				return null;
			}
		});
	},

	_importStories: function() {
		var self = this;
		this._importFromCursor(this.export().storyCursor(), "stories", function(story){
			return story.performSets({
				taskId: self._asanaIdForSourceId(story.sourceParentId())
			}).create();
		});
	},

	_importAttachments: function() {

		var self = this;
		this._importFromCursor(this.export().attachmentCursor(), "attachments", function(attachment){
			return attachment.performSets({
				taskId: self._asanaIdForSourceId(attachment.sourceParentId())
			}).create();
		});
	},

	_setAsanaIdForSourceId: function(asanaId, sourceId) {
		this._sourceToAsanaIdMap[sourceId] = asanaId;
	},

	_asanaIdForSourceId: function(sourceId) {
		return this._sourceToAsanaIdMap[sourceId] || null;
	},

	_importFromCursor: function(cursor, resourceName, setupFn) {
		console.log("importing " + resourceName + " ...");

		var count = 0;
		var self = this;
		cursor.eachBatch(this.batchSize(), function(batch){
			batch.map(setupFn).emptiesRemoved().forEach(function(future, i){
				var obj = future.wait();
				if (obj && obj.sourceId) {
					self._setAsanaIdForSourceId(obj.asanaId(), obj.sourceId());
				}
				console.log("imported " + (++ count) + " " + resourceName);
			});
		});

		console.log("imported all " + resourceName + ".\n");
	},
});