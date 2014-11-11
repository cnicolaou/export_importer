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
			email: this.email()
		});
		return this._resource().create(this._resourceData());
	},
});