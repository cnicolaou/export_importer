var aei = require("./");

var LineByLineReader = require('line-by-line');

var Importer = module.exports = aei.ideal.Proto.extend().setType("Importer").newSlots({
	organizationId: 8737056890891,
	export: null,
	teams: null,
	projects: null,
	batchSize: 5 //TODO
}).setSlots({
	run: function() {
		this.export().prepareForImport();
		this.runImport();
	},

	runImport: function() {
		this.importTeams();
		this.importProjects();
		this.importTasks();
	},

	removeTeams: function() {
		//sapi --method=POST '/teams/1097/addUser' '{"data":{"user":"1110"}}' | json_pp
		//sapi --method=POST '/teams/1097/removeUser' '{"data":{"user":"1110"}}' | json_pp
	},

	importTeams: function() {
		var self = this;
		var teamFutures = this.export().teams().forEachPerform("setOrganizationId", this.organizationId()).mapPerform("create");
		console.log("importing " + teamFutures.length + " teams ...");
		this.setTeams(teamFutures.map(function(future, i){
			var team = future.wait();
			console.log("imported " + (i + 1) + " teams");
			return team;
		}));
		console.log("imported all teams.");
	},

	importProjects: function() {
		var self = this;
		var projectFutures = this.export().projects().filter(function(project){
			project.setWorkspaceId(self.organizationId());
			project.setTeam(self.teams().detectSlot("sourceId", project.sourceTeamId()));
			return project.team();
		}).emptiesRemoved().mapPerform("create");
		console.log("importing " + projectFutures.length + " projects ...");
		var self = this;
		this.setProjects(projectFutures.map(function(future, i){
			var project = future.wait();
			console.log("imported " + (i + 1) + " projects");
			return project;
		}));
		console.log("imported all projects.");
	},

	importTasks: function() {
		var taskFutures = [];

		console.log("importing tasks ...");
		//console.log(this.projects().mapPerform("sourceId")); //2149771228110
		var task = null;
		var count = 0;

		function waitOnFutures() {
			taskFutures.forEach(function(future){
				future.wait();
				console.log("imported " + (++ count) + " tasks");
			})
			taskFutures = [];
		}

		while (task = this.export().taskCursor().next()) {
			task.performSets({
				workspaceId: this.organizationId(),
				projects: this.projects().filter(function(project){
					return task.sourceProjectIds().contains(project.sourceId());
				})
			});

			if (task.projects().length == 0) { //TODO: tasks without projects
				continue;
			}

			taskFutures.push(task.create());
			if (taskFutures.length % this.batchSize() == 0) {
				waitOnFutures();
				break; //TODO: remove this
			}
		}

		waitOnFutures();

		console.log("imported tasks.");
		
	}
});