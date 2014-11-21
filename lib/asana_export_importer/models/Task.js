var aei = require("../");

var Task = module.exports = aei.ImportObject.extend().performSets({
	type: "Task",
	resourceName: "tasks"
}).newSlots({
	sourceAssigneeId: null,
	assignee: null,
	assigneeStatus: "upcoming",
	completed: false,
	dueOn: null,
	hearted: false,
	name: "",
	notes: "",
	sourceProjectIds: null,
	projects: null,
	sourceItemIds: null,
	workspaceId: null,
	sourceFollowerIds: null
}).setSlots({
	addItem: function(itemId) {
		return aei.Future.withPromise(this._resource().setParent(itemId, {
			parent: this.asanaId()
		})).wait();
	},

	addFollowers: function(followerAsanaIds) {
		return aei.Future.withPromise(this._resource().addFollowers(this.asanaId(), {
			followers: followerAsanaIds,
			opt_silent: true
		})).wait();
	},

	_resourceData: function() {
		return {
			assignee_status: this.assigneeStatus(),
			completed: this.completed(),
			due_on: this.dueOn(),
			hearted: false,
			name: this.name(),
			notes: this.notes(),
			workspace: this.workspaceId()
		};
	},
});
