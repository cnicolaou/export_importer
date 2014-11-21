var ae = require("./");

var fs = require('fs');
var crypto = require('crypto');
function hashFile(path, algorithm) {
	var future = new ae.aei.Future;
	var hash = crypto.createHash(algorithm || "sha1");
	var input = fs.ReadStream(path);
	input.on("data", function(d) { hash.update(d); });
	input.on("end", function() { future.return(hash.digest("hex")); });
	input.on("error", function(e) { future.throw(e); });
	return future.wait();
}

var AsanaExport = module.exports = ae.aei.Export.extend().newSlots({
	db: null
}).setSlots({
	init: function() {
		this.setDb(ae.AsanaExportDb.clone());
		this._caches = {};
	},

	prepareForImport: function() {
		this._processExportFile();
	},

	_processExportFile: function() {
		this.db().setPath("db/importer-" + hashFile(this.path()) + ".sqlite3");

		if (this.db().exists()) {
			return;
		}

		try {
			this.db().create();
			var lineReader = ae.LineReader.clone().setPath(this.path());
			this._readLines(lineReader);
		} catch (e) {
			this.db().destroy();
			throw e;
		}
	},

	_readLines: function(lineReader) {
		var i = 0;
		var importedTypes = {};
		var skippedTypes = {};

		var line = null;
		while(line = lineReader.readLine()) {
			var obj = JSON.parse(line);

			if (obj.__trashed_at || obj.deactivated) {
				skippedTypes[obj.__type] = (skippedTypes[obj.__type] || 0) + 1;
				continue;
			}

			importedTypes[obj.__type] = (importedTypes[obj.__type] || 0) + 1;

			this.db().insert(obj);

			i++;
			if (i % 1000 == 0) {
				console.log("Read line " + i);
			}
		}

		// console.log("imported: ", importedTypes);
		// console.log("skipped: ", skippedTypes);
	},

	_callMethodCached: function(name) {
		if (!this._caches[name]) {
			this._caches[name] = this[name]();
		}
		return this._caches[name];
	},

	users: function() {
		return this._callMethodCached("_users");
	},

	_users: function() {
		var self = this;
		return this.db().findByType("User").map(function(obj){
			var ve = self.db().findByType("VerifiedEmail").filterProperty("ve_user", obj.__object_id).first();
			var du = self.db().findByType("DomainUser").filterProperty("user", obj.__object_id).first();
			return ae.aei.User.clone().performSets({
				sourceId: obj.__object_id,
				name: obj.name,
				email: ve && ve.ve_email || null,
				sourceItemIds: du && du.task_list ? self.db().findById(du.task_list).items : []
			});
		});
	},

	teams: function() {
		var self = this;
		return this.db().findByType("Team").map(function(obj){
			return ae.aei.Team.clone().performSets({
				sourceId: obj.__object_id,
				name: obj.name,
				teamType: obj.team_type,
				sourceMemberIds: self.db().findByType("TeamMembership").filter(function(tm) { return tm.team === obj.__object_id && tm.limited_access !== true; }).map(function(tm){ return Object.perform(self._userForDomainUserId(tm.member), "sourceId") }).emptiesRemoved()
			});
		});
	},

	projects: function() {
		var self = this;
		return this.db().findByType("ItemList").map(function(obj){
			if (obj.is_project && !obj.assignee) {
				return ae.aei.Project.clone().performSets({
					sourceId: obj.__object_id,
					name: obj.name,
					notes: obj.description,
					archived: obj.is_archived,
					color: obj.color,
					sourceTeamId: obj.team,
					sourceItemIds: obj.items,
					sourceMemberIds: self.db().findByType("ProjectMembership").filterProperty("project", obj.__object_id).map(function(pm){ return Object.perform(self._userForDomainUserId(pm.member), "sourceId") }).emptiesRemoved()
				});
			}
		}).filter(function(project) { return project && project.sourceTeamId(); });
	},

	tags: function() {
		return this.db().findByType("ItemList").map(function(obj){
			if (!obj.is_project && !obj.assignee) {
				return ae.aei.Tag.clone().performSets({
					sourceId: obj.__object_id,
					name: obj.name,
					sourceTeamId: obj.team,
					sourceItemIds: obj.items
				});
			}
		}).emptiesRemoved();
	},

	taskCursorDataSource: function() {
		var self = this;
		return function(position, chunkSize) {
			return self.db().findByType("Task", position, chunkSize).map(function(obj){
				return ae.aei.Task.clone().performSets({
					sourceId: obj.__object_id,
					name: obj.name,
					notes: obj.description,
					completed: obj.completed !== undefined,
					dueOn: obj.due_date,
					assigneeStatus: self._assigneeStatusForScheduleStatus(obj.schedule_status),
					sourceAssigneeId: Object.perform(self._userForDomainUserId(obj.assignee), "sourceId"),
					sourceItemIds: obj.items,
					sourceFollowerIds: obj.followers_du.map(function(duid){ return Object.perform(self._userForDomainUserId(duid), "sourceId") }).emptiesRemoved()
				});
			});
		}
	},

	storyCursorDataSource: function() {
		var self = this;
		return function(position, chunkSize) {
			return self.db().findByTypesLike(["Comment", "Story"], position, chunkSize).map(function(obj){
				var text = "";

				var user = self._userForDomainUserId(obj.creator_du);
				if (user) {
					if (obj.__type === "Comment") {
						text += user.name() + " commented on " + new Date(obj.__creation_time).toAsanaString() + ":\n\n";
					} else {
						text += user.name() + " ";
					}
				}

				text += obj.text;

				return ae.aei.Story.clone().performSets({
					sourceId: obj.__object_id,
					text: text,
					sourceParentId: self.db().findParentsByType(obj.__object_id, "Task").mapProperty("__object_id").first()
				});
			}).filter(function(story) { return story.sourceParentId(); });
		}
	},

	attachmentCursorDataSource: function() {
		var self = this;
		return function(position, chunkSize) {
			return self.db().findByType("Asset", position, chunkSize).map(function(obj){
				return ae.aei.Attachment.clone().performSets({
					sourceId: obj.__object_id,
					sourceParentId: self.db().findParentsByType(obj.__object_id, "Task").mapProperty("__object_id").first()
				});
			});
		}
	},

	_userForDomainUserId: function(domainUserId) {
		var du = this.db().findById(domainUserId);
		return this.users().detectSlot("sourceId", du && du.user);
	},

	_assigneeStatusForScheduleStatus: function(scheduleStatus) {
		switch (scheduleStatus) {
			case "INBOX": return "inbox";
			case "TODAY": return "today";
			case "UPCOMING": return "upcoming";
			case "OK": return "later";
		}
		return null;
	}
});
