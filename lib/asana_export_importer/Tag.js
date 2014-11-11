var aei = require("./");

var Tag = module.exports = aei.ImportObject.extend().performSets({
	type: "Tag",
	resourceName: "tags"
}).newSlots({
	workspaceId: null,
	sourceTeamId: null,
	asanaTeamId: null,
	name: null
}).setSlots({
	_resourceData: function() {
		return {
			name: this.name(),
			team: this.asanaTeamId()
		};
	},

	_createResource: function() {
		return this._resource().createInWorkspace(this.workspaceId(), this._resourceData());
	}
});