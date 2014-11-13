var aei = require("./");

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
	sourceMemberIds: null,
	team: null
}).setSlots({
	addMembers: function() {
		var self = this;
		return aei.Future.withPromise(this.app().apiClient().projects.addMembers(this.asanaId(), {
			members: this.sourceMemberIds().map(function(sourceId){
				return self.app().sourceToAsanaMap().at(sourceId);
			}).emptiesRemoved(),
			opt_silent: true
	}));
	},

	_resourceData: function() {
		return {
			archived: this.archived(),
			name: this.name(),
			color: this.color(),
			notes: this.notes(),
			workspace: this.workspaceId(),
			team: Object.perform(this.team(), "asanaId")
		};
	},

	//This will find existing projects instead of creating new ones.  Useful for development.
	__replaceCreateWithFind: function() {
		this._createResource = function() {
			var self = this;
			try {
				var project = aei.Future.withPromise(this.app().apiClient().projects.findByWorkspace(self.workspaceId())).wait().detect(function(project){
					return project.team == self.team().id && project.name == self.name();
				});
			} catch (e) {
				var error = e;
			}
			return {
				then: function(fn) {
					setImmediate(function(){
						fn(project);
					})
				},

				error: function(fn) {
				}
			}
		}
	}
});
