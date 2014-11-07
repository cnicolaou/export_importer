var aei = require("./");

var App = module.exports = aei.ideal.Proto.extend().newSlots({
	importer: null,
	apiClient: null
}).setSlots({
	shared: function() {
		if (!this._shared) {
			this._shared = App.clone();
		}
		return this._shared;
	},

	init: function() {
		this.setImporter(aei.Importer.clone());
	},

	start: function() {
		var self = this;
		return aei.Future.task(function(){
			self.importer().run();
		});
	}
});

aei.ideal.Proto.app = function() {
	return App.shared();
}