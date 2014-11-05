var ideal = require("ideal");
var LineByLineReader = require('line-by-line');
var Future = require('fibers/future');

var aei = require("./");

var LineReader = ideal.Proto.extend().newSlots({
	path: null,
	error: null,
	future: null
}).setSlots({
	init: function() {

	},

	lineReader: function() {
		if (!this._lineReader) {
			var self = this;
			var lr = new LineByLineReader(this.path());

			lr.on('error', function (err) {
				self.future().throw(err);
			});

			lr.on('line', function (line) {
			    lr.pause();
			    self.future().return(line);
			});

			lr.on('end', function () {
				self.future().return(null);
			});

			this._lineReader = lr;
		}

		return this._lineReader;
	},

	readLine: function() {
		this.setFuture(new Future);
		this.lineReader().resume();
		return this.future().wait();
	}
});

module.exports = LineReader;