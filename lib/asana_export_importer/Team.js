var aei = require("./");

aei.asana.resources.Teams.prototype.create = function(data) {
  return this.dispatcher.post('/teams', data);
};

var Team = module.exports = aei.ImportObject.extend().newSlots({
	organizationId: null,
	name: null,
	teamType: null
}).setSlots({
	postCreate: function() {
		return this.app().apiClient().teams.create({
			organization: this.organizationId(),
			name: this.name(),
			team_type: this.teamType()
		});
	}
});