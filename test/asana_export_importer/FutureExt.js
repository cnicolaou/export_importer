
describe("Array", function() {
    var order;
    function mark(name) {
        order.push(name + "(" + Array.prototype.slice.call(arguments, 1).join(",") + ")");
    }
    beforeEach(function() {
        order = [];
    });

    describe("#forEachParallel", function() {
        it("should process in parallel", function() {
            [20, 10].forEachParallel(function(delay, index) {
                mark("start", index);
                sleep(delay);
                mark("end", index);
            });
            expect(order).to.deep.equal(["start(0)", "start(1)", "end(1)", "end(0)"]);
        });

        it("should throw an error", function() {
            expect(function() {
                [1].forEachParallel(function(i) {
                    throw "Some error";
                });
            }).to.throw("Some error");
        });

        it("should respect parallelism argument", function() {
            [10, 20, 30, 40].forEachParallel(function(delay, index) {
                mark("start", index);
                sleep(delay);
                mark("end", index);
            }, null, 2);
            expect(order).to.deep.equal(["start(0)", "start(1)", "end(0)", "start(2)", "end(1)", "start(3)", "end(2)", "end(3)"]);
        });
    });

    describe("#mapParallel", function() {
        it("should process in parallel", function() {
            var result = [20, 10].mapParallel(function(delay, index) {
                mark("start", index);
                sleep(delay);
                mark("end", index);
                return index * 2;
            });
            expect(order).to.deep.equal(["start(0)", "start(1)", "end(1)", "end(0)"]);
            expect(result).to.deep.equal([0, 2]);
        });
    });
});
