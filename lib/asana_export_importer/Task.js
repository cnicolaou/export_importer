var aei = require("./");

aei.asana.resources.Tasks.prototype.findByWorkspace = function(workspaceId, data) {
  return this.dispatcher.get('/workspaces/' + workspaceId + '/tasks', params);
};

var Task = module.exports = aei.ImportObject.extend().newSlots({
	assigneeId: null,
	assigneeStatus: "upcoming",
	completed: false,
	dueOn: null,
	hearted: false,
	name: "",
	notes: "",
	sourceProjectIds: null,
	projects: null,
	workspaceId: null
}).setSlots({
	postCreate: function() {
		return this.app().apiClient().tasks.create({
			assignee: this.assigneeId(),
			assignee_status: this.assigneeStatus(),
			completed: this.completed(),
			due_on: this.dueOn(),
			hearted: false,
			name: this.name(),
			notes: this.notes(),
			projects: this.projects().mapPerform("asanaId"),
			workspace: this.workspaceId()
		});
	},

	//This will find existing teams instead of creating new ones.  Useful for development.
	replacePostCreateWithFind: function() {
		this.postCreate = function() {
			var self = this;

			var tasks = aei.Future.withPromise(this.app().apiClient().tasks.findByWorkspace(self.workspaceId())).wait();

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