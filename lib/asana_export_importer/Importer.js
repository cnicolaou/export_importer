var aei = require("./");

var LineByLineReader = require('line-by-line');

var Importer = module.exports = aei.ideal.Proto.extend().setType("Importer").newSlots({
	organizationId: 8737056890891,
	export: null,
	batchSize: 5, //TODO
}).setSlots({
	run: function() {
		this.export().prepareForImport();
		this._runImport();
	},

	_runImport: function() {
		this._importTeams();
		this._importProjects();
		this._importTasks();
		this._importSubtasks();
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
		this._sourceToAsanaIdMap = {};

		console.log("importing tasks ...");

		var count = 0;
		var self = this;
		this.export().taskCursor().eachBatch(this.batchSize(), function(batch){
			batch.map(function(task){
				return task.performSets({
					workspaceId: self.organizationId(),
					projects: self._projects.filter(function(project){
						return task.sourceProjectIds().contains(project.sourceId());
					})
				}).create();
			}).emptiesRemoved().forEach(function(future, i){
				var task = future.wait();
				self._sourceToAsanaIdMap[task.sourceId()] = task.asanaId();
				console.log("imported " + (++ count) + " tasks");
			});
		});

		console.log("imported all tasks.\n");
	},

	_importSubtasks: function() {
		console.log("importing subtasks ...");

		var count = 0;
		var self = this;
		this.export().taskCursor().reset().eachBatch(this.batchSize(), function(batch){
			batch.map(function(task){
				task.setAsanaId(self._sourceToAsanaIdMap[task.sourceId()]);
				var asanaParentId = self._sourceToAsanaIdMap[task.sourceParentId()];
				if (asanaParentId) {
					return task.updateParentId(asanaParentId);
				} else {
					return null;
				}
			}).emptiesRemoved().forEach(function(future, i){
				future.wait();
				console.log("imported " + (i + 1) + " subtasks");
			});
		});

		console.log("imported all subtasks.\n");
	}
});