var aei = require("./");

var MockApiClient = module.exports = aei.ideal.Proto.extend().newSlots({
}).setSlots({
	init: function() {
		this.teams = aei.MockApiResource.clone().setName("teams");
		this.projects = aei.MockApiResource.clone().setName("projects");
		this.tasks = aei.MockApiResource.clone().setName("tasks");
	}
});