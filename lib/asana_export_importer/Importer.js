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

	_importTeams: function() {
		this._teams = [];
		this._forEachOfType("team", function(team) {
			team.setOrganizationId(this.organizationId());
			this._teams.push(team.create());
		}, "importing teams");
	},

	_importProjects: function() {
		this._projects = [];
		this._forEachOfType("project", function(project) {
			project.setWorkspaceId(this.organizationId());
			project.setTeam(this._teamWithSourceId(project.sourceTeamId()));
			if (project.team()) {
				this._projects.push(project.create());
			}
		}, "importing projects");
	},

	_importTags: function() {
		var existingTags = aei.Future.withPromise(this.app().apiClient().workspaces.tags(this.organizationId())).wait();

		this._tags = []
		this._forEachOfType("tag", function(tag) {
			tag.setWorkspaceId(this.organizationId());

			var existingTag = existingTags.detectProperty("name", tag.name());
			if (existingTag) {
				this._tags.push(tag.setAsanaId(existingTag.id));
			} else {
				var teamSourceId = tag.sourceTeamId();
				if (teamSourceId) {
					var team = this._teamWithSourceId(teamSourceId);
					if (team) {
						tag.setAsanaTeamId(team.asanaId());
					}
				}
				this._tags.push(tag.create());
			}
		}, "importing tags");
	},

	_importTasks: function() {
		this._forEachOfType("task", function(task) {
			task.performSets({
				workspaceId: this.organizationId()
			});
			task.create();
		}, "importing tasks");
	},

	_importStories: function() {
		this._forEachOfType("story", function(story) {
			story.performSets({
				taskId: this.app().sourceToAsanaMap().at(story.sourceParentId())
			}).create();
		}, "importing stories");
	},

	_importAttachments: function() {
		this._forEachOfType("attachment", function(attachment) {
			attachment.performSets({
				taskId: this.app().sourceToAsanaMap().at(attachment.sourceParentId())
			}).create();
		}, "importing attachments");
	},

	_importUsers: function() {
		this._users = [];
		this._forEachOfType("user", function(user) {
			user.setWorkspaceId(this.organizationId());
			this._users.push(user.create());
		}, "importing users");
	},

	_addSubtasksToTasks: function() {
		this._forEachOfType("task", this._addItemsToObject, "adding subtasks to tasks");
	},

	_addTasksToProjects: function() {
		this._forEachOfType("project", this._addItemsToObject, "adding tasks to projects");
	},

	_addTasksToTags: function() {
		this._forEachOfType("tag", this._addItemsToObject, "adding tasks to tags");
	},

	_addAssigneesToTasks: function() {
		this._forEachOfType("task", function(task) {
			if (task.sourceAssigneeId()) {
				var asanaId = this._userAsanaIdWithSourceId(task.sourceAssigneeId());
				if (asanaId != null) {
					task.assignToUser(asanaId);
				}
			}
		}, "adding assignees to tasks")
	},

	_addFollowersToTasks: function() {
		this._forEachOfType("task", function(task) {
			var followerAsanaIds = task.sourceFollowerIds().map(this._userAsanaIdWithSourceId.bind(this)).emptiesRemoved();
			if (followerAsanaIds.length > 0) {
				task.addFollowers(followerAsanaIds);
			}
		}, "adding followers to tasks");
	},

	_addMembersToTeams: function() {
		this._forEachOfType("team", function(team) {
			team.sourceMemberIds().map(this._userAsanaIdWithSourceId.bind(this)).emptiesRemoved().forEach(function(memberAsanaId) {
				team.addMember(memberAsanaId);
			});
		}, "adding members to teams");
	},

	_addMembersToProjects: function() {
		this._forEachOfType("project", function(project) {
			// TODO: distinguish between members and member+followers
			var memberAsanaIds = project.sourceMemberIds().map(this._userAsanaIdWithSourceId.bind(this)).emptiesRemoved();
			if (memberAsanaIds.length > 0) {
				project.addMembers(memberAsanaIds);
			}
		}, "adding members to projects");
	},

	// helper methods:

	_forEachOfType: function(name, callback, description) {
		console.log("Starting " + description);

		var self = this;
		var count = 0;
		function process() {
			var current = ++count;
			console.log("  * started " + name + " #" + current);
			var result = callback.apply(self, arguments);
			console.log("  * completed " + name + " #" + current);
			return result;
		}

		if (this.export()[name + "Cursor"]) {
			this.export()[name + "Cursor"]().reset().eachBatch(this.batchSize(), function(batch){
				batch.mapParallel(process);
			});
		} else {
			this.export()[name + "s"]().mapParallel(process, null, self.batchSize());
		}

		console.log("Done " + description + "\n");
	},
	
	_addItemsToObject: function(object) {
		var self = this;
		object.sourceItemIds().forEach(function(sourceItemId) {
			var asanaId = self.app().sourceToAsanaMap().at(sourceItemId);
			if (asanaId) {
				object.addItem(asanaId);
			} else {
				console.log("Missing " + object.resourceName() + " id for source id: " + sourceItemId);
			}
		});
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
