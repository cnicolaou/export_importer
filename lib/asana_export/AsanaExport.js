var ae = require("./");

var AsanaExport = module.exports = ae.aei.Export.extend().newSlots({
	db: null
}).setSlots({
	init: function() {
		this.setDb(ae.AsanaExportDb.clone());
	},

	prepareForImport: function() {
		this.processExportFile();
	},

	processExportFile: function() {
		if (this.db().exists()) {
			return;
		} else {
			this.db().create();
		}

		var i = 0;

		var lineReader = ae.LineReader.clone().setPath(this.path());
		var line = null;
		while(line = lineReader.readLine()) {
			this.db().insert(line); //If you comment this out, the LineReader processes all lines
			console.log("Read line " + (++ i));
		}
	},

	teams: function() {
		return this.db().findByType("Team").map(function(obj){
			return ae.aei.Team.clone().performSets({
				sourceId: obj.__object_id,
				name: obj.name,
				teamType: obj.team_type
			});
		}).filterSlot("sourceId", 9275767906681); //TODO
	},

	projects: function() {
		return this.db().findByType("ItemList").map(function(obj){
			if (obj.is_project) {
				return ae.aei.Project.clone().performSets({
					sourceId: obj.__object_id,
					sourceTeamId: obj.team,
					archived: obj.archived,
					name: obj.name,
					color: obj.color,
					notes: obj.notes
				});
			}
		}).emptiesRemoved().filterSlot("sourceId", 15083303022168); //TODO
	},

	taskCursorDataSource: function() {
		return ae.AsanaTaskCursorDataSource.clone().setDb(this.db());
	}
});