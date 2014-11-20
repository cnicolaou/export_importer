var ae = require("./");

var AsanaExport = module.exports = ae.aei.Export.extend().newSlots({
	db: null
}).setSlots({
	init: function() {
		this.setDb(ae.AsanaExportDb.clone());
	},

	prepareForImport: function() {
		this._processExportFile();
	},

	_processExportFile: function() {
		if (this.db().exists()) {
			return;
		} else {
			this.db().create();
		}

		var lineReader = ae.LineReader.clone().setPath(this.path());
		this._readLines(lineReader);
	},

	_readLines: function(lineReader) {
		var i = 0;
		var line = null;
		while(line = lineReader.readLine()) {
			var obj = JSON.parse(line);

			if (obj.__trashed_at) {
				console.log("Skipping trashed object");
				continue;
			}

			if (obj.__type == "TaskDescriptionChangedStory") {
				console.log("Skipping TaskDescriptionChangedStory");
				continue;
			}

			this.db().insert(obj); //If you comment this out, the LineReader processes all lines
			console.log("Read line " + (++ i));
		}
	},

	users: function() {
		var self = this;
		return this.db().findByType("User").map(function(obj){
			return ae.aei.User.clone().performSets({
				sourceId: obj.__object_id,
				name: obj.name,
				email: self.db().findByType("VerifiedEmail").filterProperty("ve_user", obj.__object_id).first().ve_email
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
				sourceMemberIds: self.db().findByType("TeamMembership").filterProperty("team", obj.__object_id).map(function(tm){ return Object.perform(self._userForDomainUserId(tm.member), "sourceId") }).emptiesRemoved()
			});
		});
	},

	projects: function() {
		var self = this;
		return this.db().findByType("Pot").map(function(obj){
			if (obj.is_project) {
				return ae.aei.Project.clone().performSets({
					sourceId: obj.__object_id,
					name: obj.name,
					notes: obj.description,
					archived: obj.is_archived,
					color: obj.color,
					sourceTeamId: obj.team,
					sourceMemberIds: self.db().findByType("ProjectMembership").filterProperty("project", obj.__object_id).map(function(pm){ return Object.perform(self._userForDomainUserId(pm.member), "sourceId") }).emptiesRemoved()
				});
			}
		}).filter(function(project) { return project && project.sourceTeamId(); });
	},

	tags: function() {
		return this.db().findByType("Pot").map(function(obj){
			if (!obj.is_project && !obj.assignee) {
				return ae.aei.Tag.clone().performSets({
					sourceId: obj.__object_id,
					name: obj.name,
					sourceTeamId: obj.team
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
					sourceParentId: self.db().findParentsByType(obj.__object_id, "Task").mapProperty("__object_id").first(),
					sourceAssigneeId: Object.perform(self._userForDomainUserId(obj.assignee), "sourceId"),
					sourceProjectIds: self.db().findParentsByType(obj.__object_id, "Pot").filterProperty("is_project", true).mapProperty("__object_id"),
					sourceTagIds: self.db().findParentsByType(obj.__object_id, "Pot").filter(function(item){ return !item.is_project }).filter(function(item){ return !item.assignee }).mapProperty("__object_id"),
					sourceFollowerIds: obj.followers_du.map(function(duid){ return Object.perform(self._userForDomainUserId(duid), "sourceId") })
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
					if (obj.__type === "Comment" || obj.__type === "CommentStory") {
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
