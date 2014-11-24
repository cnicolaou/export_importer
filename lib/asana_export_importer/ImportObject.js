var aei = require("./");

var ImportObject = module.exports = aei.ideal.Proto.extend().setType("ImportObject").newSlots({
	resourceName: "Clones should set",
	sourceId: null,
	asanaId: null
}).setSlots({
	setSourceId: function(sourceId) {
		this._sourceId = sourceId;
		var asanaId = this.app().sourceToAsanaMap().at(sourceId);
		if (asanaId) {
			this.setAsanaId(asanaId);
		}
		return this;
	},

	setAsanaId: function(asanaId) {
		this._asanaId = asanaId;
		if (asanaId) {
			this.app().sourceToAsanaMap().atPut(this.sourceId(), asanaId);
		}
		return this;
	},

	create: function() {
		var response = this._createResource();
		this.setAsanaId(response.id);
		return this;
	},

	_createResource: function() {
		return aei.Future.withPromise(this._resource().create(this._resourceData())).wait();
	},

	_resource: function() {
		return this._resourceNamed(this.resourceName());
	},

	_resourceNamed: function(name) {
		return this.app().apiClient()[name];
	},

	_resourceData: function() {
		throw "Clones should override";
	}
});
