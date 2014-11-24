var aei = require("../");

var Task = module.exports = aei.ImportObject.extend().performSets({
	type: "Task",
	resourceName: "tasks"
}).newSlots({
	workspaceId: null,
	name: "",
	notes: "",
	completed: false,
	dueOn: null,
	public: false,
	assigneeStatus: "upcoming",
	sourceAssigneeId: null,
	sourceItemIds: null,
	sourceFollowerIds: null,
	stories: null
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

	addStory: function(text) {
		return aei.Future.withPromise(this._resourceNamed("stories").createOnTask(this.asanaId(), {
			text: text
		})).wait();
	},

	_resourceData: function() {
		return {
			workspace: this.workspaceId(),
			name: this.name(),
			notes: this.notes(),
			completed: this.completed(),
			due_on: this.dueOn(),
			force_public: this.public(),
			hearted: false,
			assignee_status: this.assigneeStatus()
		};
	},
});
