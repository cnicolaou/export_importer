var aei = require("./");

var ImportObject = module.exports = aei.ideal.Proto.extend().newSlots({
	sourceId: null,
	asanaId: null
}).setSlots({
	create: function() {
		var self = this;
		return aei.Future.task(function(){
			try {
				var response = aei.Future.withPromise(self.postCreate()).wait();
				self.setAsanaId(response.id);
				return self;
			} catch (e) {
				console.log(e.value.errors);
				throw e;
			}
		});
	},

	postCreate: function() {
		throw "Clones should override";
	}
});