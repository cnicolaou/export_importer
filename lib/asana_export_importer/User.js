var aei = require("./");

var User = module.exports = aei.ImportObject.extend().performSets({
	type: "User",
	resourceName: "users"
}).newSlots({
	workspaceId: null,
	name: null,
	email: null
}).setSlots({
	_createResource: function() {
		return this.app().apiClient().workspaces.addUser(this.workspaceId(), {
			user: this.asanaId(),
			opt_silent: true //TODO: This isn't working!
		});
	}
});
