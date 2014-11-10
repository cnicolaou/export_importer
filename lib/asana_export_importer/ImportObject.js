var aei = require("./");

var ImportObject = module.exports = aei.ideal.Proto.extend().setType("ImportObject").newSlots({
	resourceName: "Clones should set",
	sourceId: null,
	asanaId: null
}).setSlots({
	create: function() {
		var self = this;
		return aei.Future.task(function(){
			try {
				var response = aei.Future.withPromise(self._createResource()).wait();
				self.setAsanaId(response.id);
				return self;
			} catch (e) {
				if (e.value && e.value.errors) {
					console.log(e.value.errors);
				}
				throw e;
			}
		});
	},

	_createResource: function() {
		return this._resource().create(this._resourceData());
	},

	_resource: function() {
		return this.app().apiClient()[this.resourceName()];
	},

	_resourceData: function() {
		throw "Clones should override";
	}
});