var aei = require("./");

var MockApp = module.exports = aei.App.extend().setSlots({
	init: function() {
		aei.App.init.apply(this);
		this.importer().setExport(aei.MockExport.clone());
		this.setApiClient(aei.MockApiClient.clone());
	}
});
