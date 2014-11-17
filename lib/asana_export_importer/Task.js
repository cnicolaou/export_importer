var aei = require("./");

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
	sourceParentId: null,
	sourceTagIds: null,
	workspaceId: null,
	sourceFollowerIds: null
}).setSlots({
	updateParentId: function(parentId) {
		return aei.Future.withPromise(this._resource().setParent(this.asanaId(), { parent: parentId }));
	},

	addTag: function(tagAsanaId) {
		return aei.Future.withPromise(this._resource().addTag(this.asanaId(), { tag: tagAsanaId }));
	},

	assignToUser: function(assigneeAsanaId) {
		return aei.Future.withPromise(this._resource().update(this.asanaId(), {
			assignee: assigneeAsanaId,
			opt_silent: true
		}));
	},

	addFollowers: function(followerAsanaIds) {
		return aei.Future.withPromise(this._resource().addFollowers(this.asanaId(), {
			followers: followerAsanaIds,
			opt_silent: true
		}));
	},

	_resourceData: function() {
		return {
			assignee_status: this.assigneeStatus(),
			completed: this.completed(),
			due_on: this.dueOn(),
			hearted: false,
			name: this.name(),
			notes: this.notes(),
			projects: this.projects().mapPerform("asanaId"),
			workspace: this.workspaceId()
		};
	},

	//This will find existing teams instead of creating new ones.  Useful for development.
	__replaceCreateWithFind: function() {
		this._createResource = function() {
			var self = this;

			var task = aei.Future.withPromise(this._resource().findAll({ assignee: null })).wait().detectProperty("name", self.name());

			return {
				then: function(fn) {
					setImmediate(function(){
						fn(task);
					})
				},

				error: function() {
				}
			}
		}
	},

	//Don't call setParent.  Useful for development.
	__replaceSetParentWithNoop: function() {
		this.updateParentId = function() {
			var self = this;

			return {
				then: function(fn) {
					setImmediate(function(){
						fn();
					})
				},

				error: function() {
				}
			}
		}
	}
});
