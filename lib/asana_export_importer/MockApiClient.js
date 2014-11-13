var aei = require("./");

var MockApiClient = module.exports = aei.ideal.Proto.extend().setType("MockApiClient").newSlots({
}).setSlots({
	init: function() {
		this.teams = aei.MockApiResource.clone().setName("teams");
		this.projects = aei.MockApiResource.clone().setName("projects");
		this.tasks = aei.MockApiResource.clone().setName("tasks");
		this.stories = aei.MockApiResource.clone().setName("stories");
	}
});
