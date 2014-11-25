
describe("BatchIterable", function() {
	describe("#forEachParallel", function() {
		var iterable, data, order;
		function mark(name) {
			order.push(name + "(" + Array.prototype.slice.call(arguments, 1).join(",") + ")");
		}
		beforeEach(function() {
			order = [];
			iterable = aei.BatchIterable.clone().performSets({
				dataSource: function(chunkPosition, chunkSize) {
					mark("get", chunkPosition, chunkSize);
					return data.slice(chunkPosition, chunkPosition + chunkSize);
				}
			});
		});

		it("should process in parallel", function() {
			data = [50, 10];
			iterable.setChunkSize(2);

			iterable.forEachParallel(function(delay, index) {
				mark("start", index);
				sleep(delay);
				mark("end", index);
			}, null, 2);

			expect(order).to.deep.equal(["get(0,2)", "start(0)", "start(1)", "end(1)", "get(2,2)", "end(0)"]);
		});

		it("should fetch next batch before last current item completes", function() {
			data = [10, 50, 10, 10];
			iterable.setChunkSize(2);

			iterable.forEachParallel(function(delay, index) {
				mark("start", index);
				sleep(delay);
				mark("end", index);
			}, null, 2);

			expect(order).to.deep.equal(["get(0,2)", "start(0)", "start(1)", "end(0)", "get(2,2)", "start(2)", "end(2)", "start(3)", "end(3)", "get(4,2)", "end(1)"]);
		});
	});
});
