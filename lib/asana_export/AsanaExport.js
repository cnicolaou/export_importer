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

	userForDomainUserId: function(domainUserId) {
		var du = this.db().findById(domainUserId);
		return this.users().detectSlot("sourceId", du && du.user);
	},

	teams: function() {
		var self = this;
		return this.db().findByType("Team").map(function(obj){
			return ae.aei.Team.clone().performSets({
				sourceId: obj.__object_id,
				name: obj.name,
				teamType: obj.team_type,
				sourceMemberIds: self.db().findByType("TeamMembership").filterProperty("team", obj.__object_id).map(function(tm){ return Object.perform(self.userForDomainUserId(tm.member), "sourceId") }).emptiesRemoved()
			});
		});
	},

	projects: function() {
		var self = this;
		return this.db().findByType("Pot").map(function(obj){
			if (obj.is_project) {
				return ae.aei.Project.clone().performSets({
					sourceId: obj.__object_id,
					archived: obj.archived,
					name: obj.name,
					color: obj.color,
					notes: obj.notes,
					sourceTeamId: obj.team,
					sourceMemberIds: self.db().findByType("ProjectMembership").filterProperty("project", obj.__object_id).map(function(pm){ return Object.perform(self.userForDomainUserId(pm.member), "sourceId") }).emptiesRemoved()
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
					sourceAssigneeId: Object.perform(self.userForDomainUserId(obj.assignee), "sourceId"),
					assigneeStatus: obj.assignee_status,
					completed: obj.completed !== undefined,
					dueOn: obj.due_date,
					hearted: obj.hearted,
					name: obj.name,
					notes: obj.description,
					sourceProjectIds: self.db().findParentsByType(obj.__object_id, "Pot").filterProperty("is_project", true).mapProperty("__object_id"),
					sourceTagIds: self.db().findParentsByType(obj.__object_id, "Pot").filter(function(item){ return !item.is_project }).filter(function(item){ return !item.assignee }).mapProperty("__object_id"),
					sourceParentId: self.db().findParentsByType(obj.__object_id, "Task").mapProperty("__object_id").first(),
					sourceFollowerIds: obj.followers_du.map(function(duid){ return Object.perform(self.userForDomainUserId(duid), "sourceId") })
				});
			});
		}
	},

	storyCursorDataSource: function() {
		var self = this;
		return function(position, chunkSize) {
			return self.db().findByTypesLike(["Comment", "Story"], position, chunkSize).map(function(obj){
				var text = "";

				var user = self.userForDomainUserId(obj.creator_du);
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
	}
});
