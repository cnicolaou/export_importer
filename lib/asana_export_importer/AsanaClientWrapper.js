var asana = require("asana");
var aei = require("./");

var AsanaClientWrapper = module.exports = aei.ideal.Proto.extend().setType("AsanaClientWrapper").newSlots({
	client: null
}).setSlots({
	init: function() {
		// create a dispatcher that we use to forward to the wrapped dispatcher:
		var dispatcher = new asana.Dispatcher();
		dispatcher.dispatch = this.dispatch.bind(this);

		asana.Client.call(this, dispatcher);
	},
	setClient: function(client) {
		this._dispatcher = client.dispatcher;
	}
});
