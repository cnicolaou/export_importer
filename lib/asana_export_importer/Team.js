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
	},

	//This will find existing teams instead of creating new ones.  Useful for development.
	replacePostCreateWithFind: function() {
		this.postCreate = function() {
			var self = this;

			var teams = aei.Future.withPromise(this.app().apiClient().teams.findByOrganization(self.organizationId())).wait();

			return {
				then: function(fn) {
					setImmediate(function(){
						fn(teams.detectProperty("name", self.name()));
					})
				},

				error: function() {
				}
			}
		}
	}
});