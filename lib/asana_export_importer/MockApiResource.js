var aei = require("./");

var Promise = require("bluebird");

var MockApiResource = module.exports = aei.ideal.Proto.extend().setType("MockApiResource").newSlots({
	name: null,
	counter: 0
}).setSlots({
	create: function() {
		this.setCounter(this.counter() + 1);
		return Promise.resolve({ id: this.counter() });
	},

	createOnTask: function() {
		return this.create();
	},

	createInWorkspace: function() {
		return this.create();
	},

	setParent: function() {
		return Promise.resolve({});
	},

	addTag: function() {
		return Promise.resolve({});
	},

	addUser: function() {
		return Promise.resolve({});
	}
});
