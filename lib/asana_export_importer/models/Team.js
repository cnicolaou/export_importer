var aei = require("../");

var Team = module.exports = aei.ImportObject.extend().performSets({
	type: "Team",
	resourceName: "teams"
}).newSlots({
	organizationId: null,
	name: null,
	teamType: null,
	sourceMemberIds: null
}).setSlots({
	addMember: function(memberAsanaId) {
		return aei.Future.withPromise(this._resource().addUser(this.asanaId(), {
			user: memberAsanaId,
			opt_silent: true
		})).wait();
	},

	_resourceData: function() {
		return {
			organization: this.organizationId(),
			name: this.name(),
			team_type: this.teamType()
		};
	},
});
