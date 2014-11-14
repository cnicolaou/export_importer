var aei = require("./");

var Project = module.exports = aei.ImportObject.extend().performSets({
	resourceName: "projects"
}).newSlots({
	sourceTeamId: null,
	archived: null,
	name: null,
	color: null,
	notes: null,
	workspaceId: null,
	team: null
}).setSlots({
	_resourceData: function() {
		return {
			archived: this.archived(),
			name: this.name(),
			color: this.color(),
			notes: this.notes(),
			workspace: this.workspaceId(),
			team: this.team().asanaId()
		};
	},

	//This will find existing projects instead of creating new ones.  Useful for development.
	__replaceCreateWithFind: function() {
		this._createResource = function() {
			var self = this;
			try {
				var projects = aei.Future.withPromise(this.app().apiClient().projects.findByWorkspace(self.workspaceId())).wait();
			} catch (e) {
				var error = e;
			}
			return {
				then: function(fn) {
					setImmediate(function(){
						fn(projects.detect(function(project){ return project.team == self.team().id && project.name == self.name() }));
					})
				},

				error: function(fn) {
				}
			}
		}
	}
});