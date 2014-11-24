var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
chai.should();
chai.use(sinonChai);

var aei = require("../../lib/asana_export_importer");

function sleep(ms) {
    aei.Future.wrap(function(cb) {
        setTimeout(function() {
            cb();
        }, ms);
    })().wait();
}

describe("Array", function() {
	describe("#forEachParallel", function() {
		it("should process in parallel", function() {
			var x = [];
			[1,2].forEachParallel(function(i) {
				x.push(100+i);
				sleep(10);
				x.push(200);
			});
			x.should.deep.equal([101, 102, 200, 200]);
		});

		it("should throw an error", function() {
			function func() {
				[1].forEachParallel(function(i) {
					throw "Some error";
				});
			}
			func.should.throw("Some error");
		});

		it("should respect parallelism argument", function() {
			var x = [];
			[1,2,3,4].forEachParallel(function(i) {
				x.push(100+i);
				sleep(10);
				x.push(200);
			}, null, 2);
			x.should.deep.equal([101, 102, 200, 200, 103, 104, 200, 200]);
		});
	});

	describe("#mapParallel", function() {
		it("should process in parallel", function() {
			var x = [];
			var y = [1,2].mapParallel(function(i) {
				x.push(100 + i);
				sleep(10);
				x.push(200);
				return 300 + i;
			});
			x.should.deep.equal([101, 102, 200, 200]);
			y.should.deep.equal([301, 302]);
		});
	});
});
