var aei = require("./");

var Export = module.exports = aei.ideal.Proto.extend().newSlots({
	path: null
}).setSlots({
	prepareForImport: function() {
		throw "Clones should override";
	},

	teams: function() {
		throw "Clones should override";
	}
});