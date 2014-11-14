var aei = require("./");

var Promise = require("bluebird");

var MockApiClient = module.exports = aei.ideal.Proto.extend().setType("MockApiClient").newSlots({
	existingTags: []
}).setSlots({
	init: function() {
		var self = this;
		
		this.teams = aei.MockApiResource.clone().setName("teams");
		this.projects = aei.MockApiResource.clone().setName("projects");
		this.tags = aei.MockApiResource.clone().setName("tags");
		this.tasks = aei.MockApiResource.clone().setName("tasks");
		this.stories = aei.MockApiResource.clone().setName("stories");
		this.users = aei.MockApiResource.clone().setName("users");
		this.workspaces = aei.MockApiResource.clone().setName("workspaces").setSlots({
			tags: function() {
				return Promise.resolve(self.existingTags());
			}
		});
	}
});
