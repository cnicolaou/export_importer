var aei = require("./");

var LineByLineReader = require('line-by-line');

var Importer = module.exports = aei.ideal.Proto.extend().setType("Importer").newSlots({
	asanaApiKey: null,
	asanaClient: null,
	organizationId: 8737056890891,
	export: null,
	teams: null,
	projects: null
}).setSlots({
	run: function() {
		this.export().prepareForImport();
		this.runImport();
	},

	runImport: function() {
		this.importTeams();
		this.importProjects();
	},

	removeTeams: function() {
		//sapi --method=POST '/teams/1097/addUser' '{"data":{"user":"1110"}}' | json_pp
		//sapi --method=POST '/teams/1097/removeUser' '{"data":{"user":"1110"}}' | json_pp
	},

	importTeams: function() {
		console.log("importing teams ...");
		//this.setTeams(this.export().teams().forEachPerform("setAsanaId", 19637878199041)); //TODO
		this.setTeams(this.export().teams().forEachPerform("setOrganizationId", this.organizationId()).mapPerform("create").mapPerform("wait"));
		console.log("imported teams.");
	},

	//TODO projects without teams
	importProjects: function() {
		console.log("importing projects ...");
		/*
		this.setProjects([ //TODO
			aei.Project.clone().setAsanaId(19647124747646).setSourceId(17450081432233),
			aei.Project.clone().setAsanaId(19647124678971).setSourceId(17450081432235)
		]);
		*/
		var self = this;
		//*
		this.setProjects(this.export().projects().filter(function(project){
			project.setWorkspaceId(self.organizationId());
			project.setTeam(self.teams().detectSlot("sourceId", project.sourceTeamId()));
			return project.team();
		}).emptiesRemoved().mapPerform("create").mapPerform("wait"));
		//*/
		console.log("imported projects.");
	}
});