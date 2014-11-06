var ideal = require("ideal");
var LineByLineReader = require('line-by-line');
var Future = require('fibers/future');

var aei = require("./");

var LineReader = module.exports = ideal.Proto.extend().newSlots({
	path: null,
	error: null,
	future: null
}).setSlots({
	lineReader: function() {
		if (!this._lineReader) {
			var self = this;
			var lr = new LineByLineReader(this.path());
			lr.pause();

			lr.on('error', function (err) {
				//console.log("THROW");
				self.future().throw(err);
			});

			lr.on('line', function (line) {
				console.log("LINE");
				lr.pause();
			    self.future().return(line);
			});

			lr.on('end', function () {
				console.log("END");
				self.future().return(null);
			});

			this._lineReader = lr;
		}

		return this._lineReader;
	},

	readLine: function() {
		this.setFuture(new Future);
		console.log("BEFORE RESUME");
		this.lineReader().resume();
		console.log("AFTER RESUME");
		var line = this.future().wait();
		console.log("AFTER WAIT");
		this.setFuture(null);

		return line;
	}
});