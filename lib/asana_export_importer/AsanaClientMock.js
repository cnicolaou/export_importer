var aei = require("./");

var Promise = require("bluebird");

var AsanaClientMock = module.exports = aei.AsanaClientWrapper.extend().setType("AsanaClientMock").newSlots({
	counter: 0
}).setSlots({
	dispatch: function(params) {
		if (params.method === "GET") {
			return Promise.resolve([]);
		} else {
			this.setCounter(this.counter() + 1);
			return Promise.resolve({ id: this.counter() });
		}
	}
});
