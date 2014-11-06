var fs = require("fs");

var ideal = require("ideal");
var Future = require('fibers/future');
var sqlite3 = require('sqlite3').verbose();

var aei = require("./");

var ImporterDb = module.exports = ideal.Proto.extend().newSlots({
	path: ":memory:"
}).setSlots({
	db: function() {
		if (!this._db) {
			this._db = new sqlite3.Database(this.path());
		}

		return this._db;
	},

	recreate: function() {
		if (fs.existsSync(this.path())) {
			fs.unlinkSync(this.path());
		}

		this.run("CREATE TABLE objects(oldId BIGINTEGER, newId BIGINTEGER, type TEXT, data TEXT)").wait();
		this.run("CREATE INDEX objects_oldId ON objects(oldId)").wait();
		this.run("CREATE INDEX objects_type ON objects(type)").wait();
		this.run("CREATE TABLE relationships(parentId BIGINTEGER, childId BIGINTEGER)").wait();
		this.run("CREATE INDEX relationships_parentId ON relationships(parentId)").wait();
		this.run("CREATE INDEX relationships_childId ON relationships(childId)").wait();
	},

	insert: function(line) {
		var obj = JSON.parse(line);

		this.run("INSERT INTO objects(oldId, newId, type, data) VALUES(?,?,?,?)", [obj.__object_id, null, obj.__type, line]).wait();

		if (obj.items) {
			var self = this;
			obj.items.forEach(function(childId){
				self.run("INSERT INTO relationships(parentId, childId) VALUES(?,?)", [obj.__object_id, childId]).wait();
			});
		}
		if (obj.stories) {
			var self = this;
			obj.stories.forEach(function(childId){
				self.run("INSERT INTO relationships(parentId, childId) VALUES(?,?)", [obj.__object_id, childId]).wait();
			});
		}
	},

	findByType: function(type) {
		this.run("SELECT data FROM objects WHERE type = ?", [type]).wait();
	},

	run: function(sql, params) {
		if (!params) {
			params = [];
		}
		return Future.wrap(function(db, fn){
			db.run(sql, params, function(err){
				fn(err, this);
			})
		})(this.db());
	},

	close: function() {
		return Future.wrap(this.db().close.bind(this.db()))();
	}
	
});