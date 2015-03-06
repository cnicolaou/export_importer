
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
                    sleep(10); // simulates SQLite calls, for example
                    return data.slice(chunkPosition, chunkPosition + chunkSize);
                }
            });
        });

        it("should process in parallel", function() {
            data = [1, 2];
            iterable.setChunkSize(2);

            iterable.forEachParallel(function(value, index) {
                mark("start", value);
                sleep(20 * value);
                mark("end", value);
            }, null, 2);

            expect(order).to.deep.equal(["get(0,2)", "start(1)", "start(2)", "end(1)", "get(2,2)", "end(2)"]);
        });

        it("should fetch next batch before last current item completes", function() {
            data = [1,2,3,4];
            iterable.setChunkSize(2);

            iterable.forEachParallel(function(value, index) {
                mark("start", value);
                sleep(20 * value);
                mark("end", value);
            }, null, 2);

            expect(order).to.deep.equal([
                "get(0,2)", "start(1)", "start(2)",
                "end(1)", "get(2,2)", "start(3)",
                "end(2)", "start(4)",
                "end(3)", "get(4,2)",
                "end(4)"
            ]);
            expect(order.filter(RegExp.prototype.test.bind(/get/))).to.deep.equal(["get(0,2)", "get(2,2)", "get(4,2)"]);
            expect(order.filter(RegExp.prototype.test.bind(/start/))).to.deep.equal(["start(1)","start(2)","start(3)","start(4)"]);
        });

        it("should parallelism=4 chunkSize=2", function() {
            data = [1,2,3,4,5,6];
            iterable.setChunkSize(2);

            iterable.forEachParallel(function(value, index) {
                mark("start", value);
                sleep(20 * value);
                mark("end", value);
            }, null, 4);

            expect(order).to.deep.equal([
                "get(0,2)", "get(2,2)",
                "start(1)", "start(2)", "start(3)", "start(4)",
                "end(1)", "get(4,2)", "start(5)",
                "end(2)", "start(6)",
                "end(3)", "get(6,2)",
                "end(4)", "end(5)", "end(6)"
            ]);
        });

        it("should process any item or fetch the same batch more than once", function() {
            data = [1,2,3,4,5,6];
            iterable.setChunkSize(2);

            iterable.forEachParallel(function(value, index) {
                mark("start", value);
                sleep(20 * value);
                mark("end", value);
            }, null, 4);

            counts = {};
            order.forEach(function(mark) { counts[mark] = (counts[mark] || 0) + 1 });
            for (var name in counts) {
                expect(counts[name]).to.equal(1)
            }
        });
    });
});
