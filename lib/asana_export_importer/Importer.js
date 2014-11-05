var fs = require('fs');
var readline = require('readline');

var asana = require("asana");
var ideal = require("ideal");
var sqlite3 = require('sqlite3').verbose();

var aei = require("./");

var Importer = ideal.Proto.extend().newSlots({
	asanaApiKey: null,
	asanaClient: null,
	workspaceId: "8737056890891",
	teamId: null,
	importFilePath: null,
	dbPath: "db.sqlite3",
	db: null
}).setSlots({
	start: function() {
		//this.setupAsanaClient();
		//this.setupDb();

		this.processImportFile();
	},

	setupAsanaClient: function() {
		this.setAsanaClient(asana.Client.basicAuth(this.asanaApiKey()));
	},

	setupDb: function() {
		this.setDb(new sqlite3.Database(this.dbPath()));
	},

	processImportFile: function() {
		var self = this;
		var i = 0;
		var lineReader = aei.LineReader.clone().setPath(self.importFilePath());
		while(lineReader.readLine()) {
			console.log(++ i);
		}
	},

	processLine: function(line) {
		var obj = JSON.parse(line);
		this.db().run()
	}
});

module.exports = Importer;