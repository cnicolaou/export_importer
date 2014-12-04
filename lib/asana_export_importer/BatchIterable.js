var aei = require("./");
var FutureExt = require("./FutureExt");

var BatchIterable = module.exports = aei.ideal.Proto.extend().setType("BatchIterable").newSlots({
	chunkSize: 100,
	dataSource: null
}).setSlots({
	iterator: function() {
		var self = this;
		var chunkPosition = 0;
		var chunk = [];
		return {
			next: function() {
				if (chunk.length === 0) {
					chunk = self._dataSource(chunkPosition, self.chunkSize());
					chunkPosition += chunk.length;
				}
				if (chunk.length === 0) {
					throw "StopIteration";
				}
				return chunk.shift();
			}
		}
	},

	forEachParallel: FutureExt.Iterable_forEachParallel
});
