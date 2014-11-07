var fs = require("fs");

var sqlite3 = require('sqlite3').verbose();

var ae = require("./");

var ImporterDb = module.exports = ae.ideal.Proto.extend().newSlots({
	path: "db/importer.sqlite3"
}).setSlots({
	db: function() {
		if (!this._db) {
			this._db = new sqlite3.Database(this.path());
		}

		return this._db;
	},

	exists: function() {
		return fs.existsSync(this.path());
	},

	create: function() {
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
		return this.all("SELECT data FROM objects WHERE type = ?", [type]);
	},

	all: function(sql, params) {
		return ae.Future.wrap(this.db().all.bind(this.db())).apply(this, arguments);
	},

	run: function(sql, params) {
		if (!params) {
			params = [];
		}
		return ae.Future.wrap(function(db, fn){
			db.run(sql, params, function(err){
				fn(err, this);
			})
		})(this.db());
	},

	close: function() {
		return ae.Future.wrap(this.db().close.bind(this.db()))();
	}
	
});