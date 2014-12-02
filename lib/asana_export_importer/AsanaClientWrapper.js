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
	_dispatch: function(params) {
		return this.client().dispatcher.dispatch(params);
	}
});

// Usage:

// 	var AsanaClientMiddleware = aei.AsanaClientWrapper.clone().setSlots({
// 		dispatch: function(params) {
// 			// do stuff before request
// 			return this._dispatch(params).then(function(result) {
// 				// do stuff after request
// 				return result;
// 			});
// 		}
// 	});

