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

	//This will find existing teams instead of creating new ones.  Useful for development.
	__replaceCreateWithFind: function() {
		this._createResource = function() {
			var self = this;

			var teams = aei.Future.withPromise(this.app().apiClient().teams.findByOrganization(self.organizationId())).wait();

			return {
				then: function(fn) {
					setImmediate(function(){
						fn(teams.detectProperty("name", self.name().strip()));
					})
				},

				error: function() {
				}
			}
		}
	}
});
