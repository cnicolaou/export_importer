var aei = require("./");

var Task = module.exports = aei.ImportObject.extend().performSets({
	resourceName: "tasks"
}).newSlots({
	assigneeId: null,
	assigneeStatus: "upcoming",
	completed: false,
	dueOn: null,
	hearted: false,
	name: "",
	notes: "",
	sourceProjectIds: null,
	projects: null,
	sourceParentId: null,
	workspaceId: null
}).setSlots({
	updateParentId: function(parentId) {
		return aei.Future.withPromise(this._resource().setParent(this.asanaId(), { parent: parentId }));
	},

	_resourceData: function() {
		return {
			assignee: this.assigneeId(),
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

			var tasks = aei.Future.withPromise(this.resource().findByWorkspace(self.workspaceId())).wait();

			return {
				then: function(fn) {
					setImmediate(function(){
						fn(tasks.detectProperty("name", self.name()));
					})
				},

				error: function() {
				}
			}
		}
	}
});