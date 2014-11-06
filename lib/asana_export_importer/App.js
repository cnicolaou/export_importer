var ideal = require("ideal");

var aei = require("./");

var App = module.exports = ideal.Proto.extend().newSlots({
	importer: null,
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
		this.importer().start();
	}
});