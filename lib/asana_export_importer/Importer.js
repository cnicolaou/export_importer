var aei = require("./");

var Importer = module.exports = aei.ideal.Proto.extend().setType("Importer").newSlots({
	organizationId: null,
	export: null,
	batchSize: 50
}).setSlots({
	run: function() {
		this.export().prepareForImport();
		this._runImport();
	},

	_runImport: function() {
		//this.__removeMeFromTeamsNamed("Customer Education");
		// this.__removeMeFromAllTeams();
		//return;

		this._importTeams();
		this._importProjects();
		this._importTags();

		this._importTasks();
		this._importStories();
		this._importAttachments();

		this._addSubtasksToTasks();
		this._addTasksToProjects();
		this._addTasksToTags();

		this._importUsers();

		this._addAssigneesToTasks(); // alternatively: "_addTasksToUserTasks();"
		this._addFollowersToTasks();
		this._addMembersToTeams();
		this._addMembersToProjects();
	},

	__removeMeFromAllTeams: function(name) {
		var me = aei.Future.withPromise(this.app().apiClient().users.me()).wait();
		var self = this;
		console.log("Removing " + me.email + " from all teams  ...");
		aei.Future.withPromise(this.app().apiClient().teams.findByOrganization(this.organizationId())).wait().chunk(this.batchSize()).map(function(teams){
			teams.map(function(team){
				return aei.Future.withPromise(self.app().apiClient().teams.removeUser(team.id, { user: me.id }));
			}).forEach(function(future){
				try {
					future.wait();
				}
				catch (e) {}
			});
		});
		console.log("Removed " + me.email + " from all teams\n");
	},

	__removeMeFromTeamsNamed: function(name) {
		var me = aei.Future.withPromise(this.app().apiClient().users.me()).wait();
		var self = this;
		console.log("Removing " + me.email + " from teams named " + name + " ...");
		aei.Future.withPromise(this.app().apiClient().teams.findByOrganization(this.organizationId())).wait().filterProperty("name", name).chunk(this.batchSize()).map(function(teams){
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
		var started = 0;
		var completed = 0;
		this._projects = [];
		this.export().projects().filter(function(project){
			project.setWorkspaceId(self.organizationId());
			project.setTeam(self._teamWithSourceId(project.sourceTeamId()));
			return project.team();
		}).chunk(this.batchSize()).forEach(function(projects){
			projects.map(function(project){
				console.log("started " + (++ started) + " projects");
				return project.create();
			}).forEach(function(future, i){
				self._projects.push(future.wait());
				console.log("completed " + (++ completed) + " projects");
			});
		});
		console.log("imported all projects.\n");
	},

	_importTags: function() {
		var self = this;
		console.log("importing tags ...");
		var existingTags = aei.Future.withPromise(this.app().apiClient().workspaces.tags(this.organizationId())).wait();
		
		this._tags = [];
		var tagsToCreate = [];

		this.export().tags().map(function(tag){
			tag.setWorkspaceId(self.organizationId());

			var existingTag = existingTags.detectProperty("name", tag.name());

			if (existingTag) {
				self._tags.push(tag.setAsanaId(existingTag.id));
			} else {
				var teamSourceId = tag.sourceTeamId();
				if (teamSourceId) {
					var team = self._teamWithSourceId(teamSourceId);
					if (team) {
						tag.setAsanaTeamId(team.asanaId());
					}
				}

				tagsToCreate.push(tag);
			}

			return tag;
		});

		var count = 0;
		tagsToCreate.chunk(this.batchSize()).map(function(tagChunk){
			tagChunk.mapPerform("create").forEach(function(future){
				self._tags.push(future.wait());
				console.log("imported "  + (++ count) + " tags.");
			})
		});

		console.log("imported all tags.\n");
	},

	//TODO Project task ordering (including My Tasks)
	_importTasks: function() {
		var self = this;
		this._importFromCursor(this.export().taskCursor(), "tasks", function(task){
			return task.performSets({
				workspaceId: self.organizationId(),
				projects: task.sourceProjectIds().map(function(sourceId) {
					return self.app().sourceToAsanaMap().at(sourceId);
				}).emptiesRemoved()
			}).create();
		});
	},

	_importStories: function() {
		var self = this;
		this._importFromCursor(this.export().storyCursor(), "stories", function(story){
			return story.performSets({
				taskId: self.app().sourceToAsanaMap().at(story.sourceParentId())
			}).create();
		});
	},

	_importAttachments: function() {
		var self = this;
		this._importFromCursor(this.export().attachmentCursor(), "attachments", function(attachment){
			return attachment.performSets({
				taskId: self.app().sourceToAsanaMap().at(attachment.sourceParentId())
			}).create();
		});
	},

	_importUsers: function() {
		var self = this;
		console.log("importing users ...");
		this._users = this.export().users().map(function(user){
			return user.setWorkspaceId(self.organizationId()).create();
		}).map(function(future, i){
			var user = future.wait();
			console.log("imported " + (i + 1) + " users");
			return user;
		});
		console.log("imported all users.\n");
	},

	_importFromCursor: function(cursor, resourceName, setupFn) {
		console.log("importing " + resourceName + " ...");

		var count = 0;
		var self = this;
		cursor.eachBatch(this.batchSize(), function(batch){
			batch.map(setupFn).emptiesRemoved().forEach(function(future, i){
				var obj = future.wait();
				console.log("imported " + (++ count) + " " + resourceName);
			});
		});

		console.log("imported all " + resourceName + ".\n");
	},

	_addSubtasksToTasks: function() {
		var self = this;
		this._importFromCursor(this.export().taskCursor().reset(), "subtasks", function(task){
			var asanaParentId = self.app().sourceToAsanaMap().at(task.sourceParentId());
			if (asanaParentId !== null) {
				return task.updateParentId(asanaParentId);
			} else {
				return null;
			}
		});
	},

	_addTasksToProjects: function() {
	},

	_addTasksToTags: function() {
		console.log("adding tags to tasks ...");

		var count = 0;
		var self = this;
		var task = null;
		var futuresBatch = aei.FuturesBatch.clone();
		this.export().taskCursor().reset();
		while (task = this.export().taskCursor().next()) {
			var self = this;
			task.sourceTagIds().forEach(function(sourceId){
				var tag = self.app().sourceToAsanaMap().at(sourceId);
				if (tag) {
					futuresBatch.add(task.addTag(tag))
				} else {
					console.log("Missing tag for sourceId: ", sourceId);
				}
			});
		}

		futuresBatch.wait();

		console.log("added all tags to tasks.\n");
	},

	_addAssigneesToTasks: function() {

	},

	_addFollowersToTasks: function() {
		var self = this;
		console.log("adding followers to tasks ...");

		var count = 0;
		var task = null;
		var futuresBatch = aei.FuturesBatch.clone();
		this.export().taskCursor().reset();
		while (task = this.export().taskCursor().next()) {
			if (task.sourceAssigneeId()) {
				var asanaId = self._userAsanaIdWithSourceId(task.sourceAssigneeId());
				if (asanaId != null) {
					futuresBatch.add(task.assignToUser(asanaId));
				}
			}

			var followerAsanaIds = task.sourceFollowerIds().map(self._userAsanaIdWithSourceId.bind(self)).emptiesRemoved();
			if (followerAsanaIds.length > 0) {
				futuresBatch.add(task.addFollowers(followerAsanaIds));
			}
		}
		futuresBatch.wait();

		console.log("added followers to tasks.\n");
	},

	_addMembersToTeams: function() {
		var self = this;
		console.log("adding users to teams ...");

		var futuresBatch = aei.FuturesBatch.clone();
		this.export().teams().forEach(function(team) {
			team.sourceMemberIds().map(self._userAsanaIdWithSourceId.bind(self)).emptiesRemoved().forEach(function (memberAsanaId) {
				futuresBatch.add(team.addMember(memberAsanaId));
			});
		});
		futuresBatch.wait();


		console.log("added users for all teams.\n")
	},

	_addMembersToProjects: function() {
		var self = this;
		console.log("adding users to projects ...");

		var futuresBatch = aei.FuturesBatch.clone();
		this.export().projects().forEach(function(project) {
			// TODO: distinguish between members and member+followers
			var memberAsanaIds = project.sourceMemberIds().map(self._userAsanaIdWithSourceId.bind(self)).emptiesRemoved();
			if (memberAsanaIds.length > 0) {
				futuresBatch.add(project.addMembers(memberAsanaIds));
			}
		});
		futuresBatch.wait();

		console.log("added users for all projects.\n")
	},

	_teamWithSourceId: function(sourceId) {
		var team = this._teams.detectSlot("sourceId", sourceId);
		if (team == null) {
			console.warn("Missing team for sourceId: " + sourceId);
		}
		return team;
	},

	_userWithSourceId: function(sourceId) {
		var user = this._users.detectSlot("sourceId", sourceId);
		if (user == null) {
			console.warn("Missing user for sourceId: " + sourceId);
		}
		return user;
	},

	_userAsanaIdWithSourceId: function(sourceId) {
		return this._userWithSourceId(sourceId).asanaId();
	}
});
