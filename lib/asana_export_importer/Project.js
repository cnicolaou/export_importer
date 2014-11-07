var aei = require("./");

var Project = module.exports = aei.ImportObject.extend().newSlots({
	sourceTeamId: null,
	archived: null,
	name: null,
	color: null,
	notes: null,
	workspaceId: null,
	team: null
}).setSlots({
	postCreate: function() {
		return this.app().apiClient().projects.create({
			archived: this.archived(),
			name: this.name(),
			color: this.color(),
			notes: this.notes(),
			workspace: this.workspaceId(),
			team: this.team().asanaId()
		});
	}
});