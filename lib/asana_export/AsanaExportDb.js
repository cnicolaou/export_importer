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
		this.run("CREATE TABLE objects(sourceId BIGINTEGER, type TEXT, data TEXT)");
		this.run("CREATE INDEX objects_sourceId ON objects(sourceId)");
		this.run("CREATE INDEX objects_type ON objects(type)");
		this.run("CREATE TABLE relationships(parentId BIGINTEGER, childId BIGINTEGER)");
		this.run("CREATE INDEX relationships_parentId ON relationships(parentId)");
		this.run("CREATE INDEX relationships_childId ON relationships(childId)");
	},

	insert: function(obj) {
		this.run("INSERT INTO objects(sourceId, type, data) VALUES(?,?,?)", [obj.__object_id, obj.__type, JSON.stringify(obj)]);

		this.insertRelationships(obj, obj.items);
		this.insertRelationships(obj, obj.stories);
		this.insertRelationships(obj, obj.attachments);
	},

	insertRelationships: function(parent, children) {
		if (children) {
			var self = this;
			children.forEach(function(childId){
				self.run("INSERT INTO relationships(parentId, childId) VALUES(?,?)", [parent.__object_id, childId]);
			});
		}
	},

	findByType: function(type, offset, limit) {
		var sql = "SELECT data FROM objects WHERE type = ?";
		var params = [type];

		if (limit != undefined) {
			sql += " LIMIT ?";
			params.push(limit);
		}

		if (offset !== undefined) {
			sql += " OFFSET ?";
			params.push(offset);
		}

		return this.allObjects(sql, params);
	},

	findByTypesLike: function(types, offset, limit) {
		var sql = "SELECT data FROM objects WHERE (" + types.map(function(){ return "type LIKE ?" }).join(" OR ") + ")";
		var params = types.map(function(type){ return "%" + type + "%" });

		if (limit != undefined) {
			sql += " LIMIT ?";
			params.push(limit);
		}

		if (offset !== undefined) {
			sql += " OFFSET ?";
			params.push(offset);
		}

		return this.allObjects(sql, params);
	},

	findChildrenByType: function(parentId, type) {
		return this.allObjects("SELECT data FROM objects, relationships WHERE parentId = ? AND sourceId = childId AND type = ?", [parentId, type]);
	},

	findParentsByType: function(childId, type) {
		return this.allObjects("SELECT data FROM objects, relationships WHERE childId = ? AND sourceId = parentId AND type = ?", [childId, type]);
	},

	findById: function(sourceId) {
		return this.allObjects("SELECT data FROM objects WHERE sourceId = ? LIMIT 1", [sourceId]).first();
	},

	allObjects: function() {
		return this.db().all.bind(this.db()).futureWrap().apply(this, arguments).wait().map(function(row){ return JSON.parse(row.data) });
	},

	run: function(sql, params) {
		if (!params) {
			params = [];
		}

		return ae.Future.wrap(function(db, fn){
			db.run(sql, params, function(err){
				fn(err, this);
			})
		})(this.db()).wait();
	},

	close: function() {
		return this.db().close.bind(this.db()).futureWrap().wait();
	}
	
});
