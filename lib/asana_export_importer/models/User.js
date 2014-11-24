var aei = require("../");

var User = module.exports = aei.ImportObject.extend().performSets({
	type: "User",
	resourceName: "users"
}).newSlots({
	workspaceId: null,
	name: null,
	email: null,
	sourceItemIds: null
}).setSlots({
	addItem: function(taskId) {
		return aei.Future.withPromise(this._resourceNamed("tasks").update(taskId, {
			assignee: this.asanaId(),
			opt_silent: true
		})).wait();
	},

	_createResource: function() {
		return aei.Future.withPromise(this.app().apiClient().workspaces.addUser(this.workspaceId(), {
			user: this.email(),
			opt_silent: true //TODO: This isn't working!
		})).wait();
	}
});
