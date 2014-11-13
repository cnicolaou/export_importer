var aei = require("./");
var fs = require("fs");

var App = module.exports = aei.ideal.Proto.extend().setType("App").newSlots({
	importer: null,
	apiClient: null,
	attachmentsPath: null,
	sourceToAsanaMap: null
}).setSlots({
	shared: function() {
		if (!this._shared) {
			this._shared = App.clone();
		}
		return this._shared;
	},

	init: function() {
		this.setImporter(aei.Importer.clone());
		this.setSourceToAsanaMap(aei.SourceToAsanaMap.clone());
	},

	start: function() {
		var self = this;
		if (fs.existsSync(this.attachmentsPath())) {
			fs.unlinkSync(this.attachmentsPath());
		}
		return aei.Future.task(function(){
			self.importer().run();
		});
	}
});

aei.ideal.Proto.app = function() {
	return App.shared();
};
