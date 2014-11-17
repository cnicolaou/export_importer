var aei = require("./");

var LineByLineReader = require('line-by-line');

var Importer = module.exports = aei.ideal.Proto.extend().setType("Importer").newSlots({
	organizationId: 8737056890891,
	export: null,
	batchSize: 50
}).setSlots({
	run: function() {
		this.export().prepareForImport();
		this._runImport();
	},

	_runImport: function() {
		//this.__removeMeFromTeamsNamed("Customer Education");
		this.__removeMeFromAllTeams();
		//return;

		this._importTeams();
		this._importProjects();
		return;
		this._importTags();
		this._importTasks();
		this._importSubtasks();
		this._importTaskTags();
		this._importStories();
		this._importAttachments();
		this._importUsers();
		//this._addUsersToTeams();
		this._addUsersToProjects();
		//this._addUsersToTasks();
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
		var projects = [];
		this.export().projects().filter(function(project){
			project.setWorkspaceId(self.organizationId());
			project.setTeam(self._teams.detectSlot("sourceId", project.sourceTeamId()));
			return project.team();
		}).chunk(this.batchSize()).forEach(function(projects){
			projects.map(function(project){
				console.log("started " + (++ started) + " projects");
				return project.create();
			}).forEach(function(future, i){
				projects.push(future.wait());
				console.log("completed " + (++ completed) + " projects");
			});
		});
		this._projects = projects;
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
				tags.push(tag.setAsanaId(existingTag.id));
			} else {
				var team = self._teams.detectSlot("sourceId", tag.sourceTeamId());
				if (team) {
					tag.setAsanaTeamId(team.asanaId());
				}

				tagsToCreate.push(tag);
			}

			return tag;
		});

		var count = 0;
		tagsToCreate.chunk(this.batchSize()).map(function(tagChunk){
			tagChunk.mapPerform("create").forEach(function(future){
				tags.push(future.wait());
				console.log("imported "  + (++ count) + " tags.");
			})
		});

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
			var asanaParentId = self.app().sourceToAsanaMap().at(task.sourceParentId());
			if (asanaParentId !== null) {
				return task.updateParentId(asanaParentId);
			} else {
				return null;
			}
		});
	},

	_importTaskTags: function() {
		console.log("adding tags to tasks ...");

		var count = 0;
		var self = this;
		var task = null;
		var futuresBatch = aei.FuturesBatch.clone();
		this.export().taskCursor().reset();
		while (task = this.export().taskCursor().next()) {
			var self = this;
			task.sourceTagIds().forEach(function(sourceId){
				futuresBatch.add(task.addTag(self.app().sourceToAsanaMap().at(sourceId)));
			});
		}

		futuresBatch.wait();

		console.log("added all tags to tasks.\n");
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

	_addUsersToProjects: function() {
		var self = this;
		console.log("adding users to projects ...");
		var futuresBatch = aei.FuturesBatch.clone();
		this.export().projects().forEach(function(project){
			//TODO: assignee, followers
			futuresBatch.add(project.addMembers());
		});
		futuresBatch.wait();
		console.log("added users for all projects.\n")
	},

	/* TODO: Not fully implemented / tested
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
	*/
});