var fs = require('fs');
var readline = require('readline');

var asana = require("asana");
var ideal = require("ideal");

var aei = require("./");

var LineByLineReader = require('line-by-line');

var Importer = module.exports = ideal.Proto.extend().newSlots({
	asanaApiKey: null,
	asanaClient: null,
	workspaceId: "8737056890891",
	teamId: null,
	importFilePath: null,
	db: null
}).setSlots({
	init: function() {
		this.setDb(aei.ImporterDb.clone());
	},

	start: function() {
		//this.setupAsanaClient();
		this.setupDb();
		this.processImportFile();
		//this.importFromDb();
		this.db().close().wait();
	},

	setupAsanaClient: function() {
		this.setAsanaClient(asana.Client.basicAuth(this.asanaApiKey()));
	},

	setupDb: function() {
		this.db().recreate();
	},

	processImportFile: function() {
		var self = this;
		var i = 0;

		var lineReader = aei.LineReader.clone().setPath(self.importFilePath());
		var line = null;
		while(line = lineReader.readLine()) {
			self.db().insert(line); //If you comment this out, the LineReader processes all lines
			console.log(++ i);
		}
	},

	importFromDb: function() {
		console.log(this.db().findByType("TEAM"));
	}
});