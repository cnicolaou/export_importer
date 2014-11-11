var aei = require("./");

var LineByLineReader = require('line-by-line');

var Importer = module.exports = aei.ideal.Proto.extend().setType("Importer").newSlots({
	organizationId: 8737056890891,
	export: null,
	batchSize: 100
}).setSlots({
	run: function() {
		this.export().prepareForImport();
		this._runImport();
	},

	_runImport: function() {
		this._sourceToAsanaIdMap = {};

		this.__removeMeFromTeamsNamed("Customer Education");

		this._importTeams();
		this._importProjects();
		this._importTags();
		this._importTasks();
		this._importSubtasks();
		//this._importTaskTags();
		this._importStories();
		this._importAttachments();
		//this._importUsers();
		//this._addUsersToProjects();
		//this._addUsersToTasks();
	},

	__removeMeFromTeamsNamed: function(name) {
		var me = aei.Future.withPromise(this.app().apiClient().users.me()).wait();
		var self = this;
		console.log("Removing " + me.email + " from teams named " + name + " ...");
		aei.Future.withPromise(this.app().apiClient().teams.findByOrganization(this.organizationId())).wait().filterProperty("name", name).split(this.batchSize()).map(function(teams){
			teams.map(function(team){
				return aei.Future.withPromise(self.app().apiClient().teams.removeUser(team.id, { user: me.id }));
			}).forEach(function(future){
				try {
					future.wait();
				}
				catch (e) {}
			});
		});
		console.log("Removed " + me.email + " from teams named " + name + " ...\n");
	},

	_importTeams: function() {
		var self = this;
		console.log("importing teams ...");
		this._teams = this.export().teams().forEachPerform("setOrganizationId", this.organizationId()).mapPerform("create").map(function(future, i){
			var team = future.wait();
			console.log("imported " + (i + 1) + " teams");
			return team;
		});
		console.log("imported all teams.\n");
	},

	_importProjects: function() {
		var self = this;
		console.log("importing projects ...");
		this._projects = this.export().projects().filter(function(project){
			project.setWorkspaceId(self.organizationId());
			project.setTeam(self._teams.detectSlot("sourceId", project.sourceTeamId()));
			return project.team();
		}).mapPerform("create").map(function(future, i){
			var project = future.wait();
			console.log("imported " + (i + 1) + " projects");
			return project;
		});
		console.log("imported all projects.\n");
	},

	_importTags: function() {
		var self = this;
		console.log("importing tags ...");
		var existingTags = aei.Future.withPromise(this.app().apiClient().workspaces.tags(this.organizationId())).wait();
		
		var tags = [];
		var tagsToCreate = [];

		this.export().tags().map(function(tag){
			tag.setWorkspaceId(self.organizationId());

			var existingTag = existingTags.detectProperty("name", tag.name());

			if (existingTag) {
				tag.setAsanaId(existingTag.id);
				tags.push(tag);
			} else {
				var team = self._teams.detectSlot("sourceId", tag.sourceTeamId());
				if (team) {
					tag.setAsanaTeamId(team.asanaId());
				}

				tagsToCreate.push(tag);
			}

			return tag;
		});

		tags.concat(tagsToCreate.mapPerform("create").forEach(function(future){
			var tag = future.wait();
			console.log(tag);
			self._setAsanaIdForSourceId(tag.asanaId(), tag.sourceId());
		}));

		this._tags = tags;

		console.log("imported all tags.\n");
	},

	//TODO Project task ordering (including My Tasks)
	_importTasks: function() {
		var self = this;
		this._importFromCursor(this.export().taskCursor(), "tasks", function(task){
			return task.performSets({
				workspaceId: self.organizationId(),
				projects: self._projects.filter(function(project){
					return task.sourceProjectIds().contains(project.sourceId());
				})
			}).create();
		});
	},

	_importSubtasks: function() {
		var self = this;
		this._importFromCursor(this.export().taskCursor().reset(), "subtasks", function(task){
			task.setAsanaId(self._asanaIdForSourceId(task.sourceId()));
			var asanaParentId = self._asanaIdForSourceId(task.sourceParentId());
			if (asanaParentId !== null) {
				return task.updateParentId(asanaParentId);
			} else {
				return null;
			}
		});
	},

	//TODO
	_importTaskTags: function() {
		console.log("adding tags to tasks ...");

		var count = 0;
		var self = this;
		var task = null;
		var futuresBatch = aei.FuturesBatch.clone();
		this.export().taskCursor().reset();
		while (task = this.export().taskCursor().next()) {
			task.sourceTagIds().forEach(function(sourceId){
				futuresBatch.add(task.addTag(this._asanaIdForSourceId(sourceId)));
			});
		}

		futuresBatch.wait();

		console.log("added all tags to tasks.\n");
	},

	_importStories: function() {
		var self = this;
		this._importFromCursor(this.export().storyCursor(), "stories", function(story){
			return story.performSets({
				taskId: self._asanaIdForSourceId(story.sourceParentId())
			}).create();
		});
	},

	_importAttachments: function() {

		var self = this;
		this._importFromCursor(this.export().attachmentCursor(), "attachments", function(attachment){
			return attachment.performSets({
				taskId: self._asanaIdForSourceId(attachment.sourceParentId())
			}).create();
		});
	},

	//TODO: Use asanaId for Asana, email / name for 3rd parties
	_importUsers: function() {
		var self = this;
		console.log("importing users ...");
		var existingUsers = aei.Future.withPromise(this.app().apiClient().workspaces.users(this.organizationId())).wait();

		this._users = this.export().users().map(function(user){
			var existing = existingUsers.detectProperty("email", user.email());
			if (existing) {
				user.setAsanaId(existing.id);
			}
			return user;
		}).rejectPerform("asanaId").map(function(user){
			return user.setWorkspaceId(self.organizationId()).create();
		}).map(function(future, i){
			var team = future.wait();
			console.log("imported " + (i + 1) + " users");
			return team;
		});
		console.log("imported all users.\n");
	},

	_setAsanaIdForSourceId: function(asanaId, sourceId) {
		this._sourceToAsanaIdMap[sourceId] = asanaId;
	},

	_asanaIdForSourceId: function(sourceId) {
		return this._sourceToAsanaIdMap[sourceId] || null;
	},

	_importFromCursor: function(cursor, resourceName, setupFn) {
		console.log("importing " + resourceName + " ...");

		var count = 0;
		var self = this;
		cursor.eachBatch(this.batchSize(), function(batch){
			batch.map(setupFn).emptiesRemoved().forEach(function(future, i){
				var obj = future.wait();
				if (obj && obj.sourceId) {
					self._setAsanaIdForSourceId(obj.asanaId(), obj.sourceId());
				}
				console.log("imported " + (++ count) + " " + resourceName);
			});
		});

		console.log("imported all " + resourceName + ".\n");
	},

	//TODO
	_addUsersToProjects: function() {
		var self = this;
		console.log("adding users to projects ...");
		this.projects().forEach(function(project){
			//TODO
		});
		console.log("added users for all projects.\n")
	},

	_userWithSourceId: function(id) {
		return this._users.detectSlot("sourceId", id);
	},

	//TODO: Not tested
	_addUsersToTasks: function() {
		console.log("adding users to tasks ...");

		var count = 0;
		var self = this;
		var task = null;
		var futuresBatch = aei.FuturesBatch.clone();
		while (task = this.export().taskCursor().next()) {
			if (task.sourceAssigneeId()) {
				futuresBatch.add(task.assignToUser(this._userWithSourceId(task.sourceAssigneeId())));
			}

			task.followerSourceUserIds().forEach(function(sourceId){
				futuresBatch.add(task.addFollower(this._userWithSourceId(sourceId)));
			});

			task.followerSourceUserIds().forEach(function(sourceId){
				futuresBatch.add(task.addFollower(this._userWithSourceId(sourceId)));
			});
		}

		futuresBatch.wait();

		console.log("imported all " + resourceName + ".\n");
	}
});