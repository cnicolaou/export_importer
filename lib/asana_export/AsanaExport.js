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

		var self = this;
		var i = 0;

		var lineReader = ae.LineReader.clone().setPath(self.path());
		var line = null;
		while(line = lineReader.readLine()) {
			self.db().insert(line); //If you comment this out, the LineReader processes all lines
			console.log(++ i);
		}
	},

	teams: function() {
		return this.db().findByType("Team").wait().map(function(row){
			var obj = JSON.parse(row.data);
			return ae.aei.Team.clone().performSets({
				sourceId: obj.__object_id,
				name: obj.name,
				teamType: obj.team_type
			});
		}).filterSlot("sourceId", 17450081432232); //TODO
	},

	projects: function() {
		return this.db().findByType("ItemList").wait().map(function(row){
			var obj = JSON.parse(row.data);
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
		}).emptiesRemoved().filterSlot("sourceTeamId", 17450081432232); //TODO
	}
});