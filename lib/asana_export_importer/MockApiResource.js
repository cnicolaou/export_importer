var aei = require("./");

var MockApiResource = module.exports = aei.ideal.Proto.extend().newSlots({
	name: null,
	counter: -1
}).setSlots({
	create: function() {
		var self = this;
		this.setCounter(this.counter() + 1);
		return {
			then: function(fn) {
				fn({
					id: self.counter()
				});
			},

			error: function() {

			}
		}
	}
});