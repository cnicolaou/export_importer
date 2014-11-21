var aei = require("../");

var Project = module.exports = aei.ImportObject.extend().performSets({
	type: "Project",
	resourceName: "projects"
}).newSlots({
	sourceTeamId: null,
	archived: null,
	name: null,
	color: null,
	notes: null,
	workspaceId: null,
	sourceItemIds: null,
	sourceMemberIds: null,
	asanaTeamId: null
}).setSlots({
	addMembers: function(memberAsanaIds) {
		return aei.Future.withPromise(this._resource().addMembers(this.asanaId(), {
			members: memberAsanaIds,
			opt_silent: true
		})).wait();
	},

	addItem: function(taskId) {
		return aei.Future.withPromise(this._resourceNamed("tasks").addProject(taskId, {
			project: this.asanaId()
		})).wait();
	},

	_resourceData: function() {
		return {
			archived: this.archived(),
			name: this.name(),
			color: this.color(),
			notes: this.notes(),
			workspace: this.workspaceId(),
			team: this.asanaTeamId()
		};
	},
});
