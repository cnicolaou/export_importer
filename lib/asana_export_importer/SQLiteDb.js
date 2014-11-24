
var aei = require("./");

var fs = require("fs");
var sqlite3 = require("sqlite3");

var SQLiteDb = module.exports = aei.ideal.Proto.extend().newSlots({
	path: ":memory:"
}).setSlots({
	db: function() {
		if (!this._db) {
			this._db = new sqlite3.Database(this.path());
		}
		return this._db;
	},

	exists: function() {
		if (this.path() === ":memory:") {
			return true;
		} else {
			return fs.existsSync(this.path());
		}
	},

	destroy: function() {
		if (this.path() === ":memory:") {
			return true;
		} else {
			return fs.unlinkSync(this.path());
		}
	},

	close: function() {
		return this.db().close.bind(this.db()).futureWrap().apply(this, arguments).wait();
	},

	all: function() {
		return this.db().all.bind(this.db()).futureWrap().apply(this, arguments).wait();
	},

	run: function(sql, params) {
		return this.db().run.bind(this.db()).futureWrap().apply(this, arguments).wait();
	}
});
