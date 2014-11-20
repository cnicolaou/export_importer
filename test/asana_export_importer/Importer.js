var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
chai.should();
chai.use(sinonChai);

var aei = require("../../lib/asana_export_importer");

describe("Importer", function() {
	var app = aei.App.shared();
	var importer = null;
	var exp = null;
	var client = null;

	beforeEach(function() {
		app.setSourceToAsanaMap(aei.SourceToAsanaMap.clone());

		importer = aei.Importer.clone();
		app.setImporter(importer);

		exp = aei.MockExport.clone();
		importer.setExport(exp);

		client = aei.MockApiClient.clone();
		app.setApiClient(client);

		["teams", "projects", "tags", "tasks", "stories", "users"].forEach(function(type) {
			sinon.spy(client[type], "create");
		});
		sinon.spy(client.tags, "createInWorkspace");
		sinon.spy(client.stories, "createOnTask");
		sinon.spy(client.tasks, "setParent");
		sinon.spy(client.tasks, "addTag");
		sinon.spy(client.tasks, "addFollowers");
		sinon.spy(client.tasks, "addProject");
		sinon.spy(client.tasks, "update");
		sinon.spy(client.teams, "addUser");
		sinon.spy(client.projects, "addMembers");
		sinon.spy(client.workspaces, "addUser");
	});

	describe("#run()", function() {
		it("should run with no data", function() {
			importer.run();

			["teams", "projects", "tags", "tasks", "stories", "users"].forEach(function(type) {
				client.teams.create.should.not.have.been.called;
			});
			client.tags.createInWorkspace.should.not.have.been.called;
			client.stories.createOnTask.should.not.have.been.called;
			client.workspaces.addUser.should.not.have.been.called;
			importer._teams.should.have.length(0);
			importer._projects.should.have.length(0);
			importer._tags.should.have.length(0);
			importer._users.should.have.length(0);
		});
	});

	describe("#_importTeams()", function() {
		it("should create some teams", function() {
			exp.setMockData({
				teams: [
					{ sourceId: 1, name: "team foo", teamType: "PUBLIC", sourceMemberIds: [] },
					{ sourceId: 2, name: "team bar", teamType: "PUBLIC", sourceMemberIds: [] }
				]
			});

			importer._importTeams();

			client.teams.create.should.have.been.calledTwice;
			importer._teams.should.have.length(2);
		});
	});

	describe("#_importProjects()", function() {
		it("should not create a project without a team", function() {
			exp.setMockData({
				teams: [],
				projects: [{ sourceId: 1, archived: false, name: "project foo", sourceTeamId: null, sourceMemberIds: [] }]
			});

			importer._importTeams();
			importer._importProjects();

			client.projects.create.should.not.have.been.called;
			importer._projects.should.have.length(0);
		});

		it("should create a project with a corresponding team", function() {
			exp.setMockData({
				teams: [{ sourceId: 100, name: "team1", teamType: "PUBLIC", sourceMemberIds: [] }],
				projects: [{ sourceId: 101, name: "project1", sourceTeamId: 100, sourceMemberIds: [] }]
			});

			importer._importTeams();
			importer._importProjects();

			client.projects.create.should.have.been.calledOnce;
			client.tags.create.should.not.have.been.called;
			client.projects.create.getCall(0).args[0]['team'].should.equal(app.sourceToAsanaMap().at(100))
		});
	});

	describe("#_importTags()", function() {
		it("should create a tag", function() {
			exp.setMockData({
				tags: [{ sourceId: 1, name: "tag foo", sourceTeamId: null }]
			});

			importer._importTags();

			client.tags.createInWorkspace.should.have.been.calledOnce;
			client.projects.create.should.not.have.been.called;
			importer._tags.should.have.length(1);
		});

		it("should not create duplicate tags", function() {
			exp.setMockData({
				tags: [{ sourceId: 1, name: "tag foo", sourceTeamId: null }]
			});
			client.setExistingTags([ { name: "tag foo", id: 1 } ]);

			importer._importTags();

			client.tags.create.should.not.have.been.called;
			client.tags.createInWorkspace.should.not.have.been.called;
			importer._tags.should.have.length(1);
		});
	});

	describe("#_importTasks()", function() {
		it("should create a task", function() {
			exp.setMockData({
				tasks: [{ sourceId: 1, name: "task foo", sourceFollowerIds: [], sourceItemIds: [] }]
			});

			importer._importTasks();

			client.tasks.create.should.have.been.calledOnce;
		});
	});

	describe("#_importStories", function() {
		it("should add a story to the correct task", function() {
			exp.setMockData({
				tasks: [{ sourceId: 100, name: "task foo", sourceFollowerIds: [] }],
				stories: [{ sourceId: 101, text: "story text", sourceParentId: 100 }]
			});

			importer._importTasks();
			importer._importStories();

			client.stories.createOnTask.should.have.been.calledOnce;
			client.stories.createOnTask.should.have.been.calledWithExactly(app.sourceToAsanaMap().at(100), { text: "story text" });
		});
	});

	describe("#_importAttachments", function() {
		it("", function() {
		});
	});

	describe("#_addSubtasksToTasks", function() {
		it("should add subtasks in the correct order", function() {
			exp.setMockData({
				tasks: [
					{ sourceId: 100, name: "task1",    sourceFollowerIds: [], sourceItemIds: [201, 202] },
					{ sourceId: 101, name: "task2",    sourceFollowerIds: [], sourceItemIds: [203, 200] },
					{ sourceId: 200, name: "subtask1", sourceFollowerIds: [], sourceItemIds: [] },
					{ sourceId: 201, name: "subtask2", sourceFollowerIds: [], sourceItemIds: [] },
					{ sourceId: 202, name: "subtask3", sourceFollowerIds: [], sourceItemIds: [] },
					{ sourceId: 203, name: "subtask4", sourceFollowerIds: [], sourceItemIds: [] }
				]
			});

			importer._importTasks();
			importer._addSubtasksToTasks();

			client.tasks.setParent.callCount.should.equal(4);

			client.tasks.setParent.getCall(0).args.should.deep.equal([app.sourceToAsanaMap().at(201), { parent: app.sourceToAsanaMap().at(100) }])
			client.tasks.setParent.getCall(1).args.should.deep.equal([app.sourceToAsanaMap().at(202), { parent: app.sourceToAsanaMap().at(100) }])
			client.tasks.setParent.getCall(2).args.should.deep.equal([app.sourceToAsanaMap().at(203), { parent: app.sourceToAsanaMap().at(101) }])
			client.tasks.setParent.getCall(3).args.should.deep.equal([app.sourceToAsanaMap().at(200), { parent: app.sourceToAsanaMap().at(101) }])
		});
	});

	describe("#_addTasksToProjects", function() {
		it("should add tasks to projects in the correct order", function() {
			exp.setMockData({
				teams: [{ sourceId: 100, name: "team1", teamType: "PUBLIC", sourceMemberIds: [] }],
				projects: [
					{ sourceId: 200, name: "project1", sourceTeamId: 100, sourceMemberIds: [], sourceItemIds: [300, 301] }
				],
				tasks: [
					{ sourceId: 300, name: "task1", sourceFollowerIds: [], sourceItemIds: [] },
					{ sourceId: 301, name: "task2", sourceFollowerIds: [], sourceItemIds: [] }
				]
			});

			importer._importTeams();
			importer._importProjects();
			importer._importTasks();
			importer._addTasksToProjects();

			client.tasks.addProject.should.have.been.called;
			client.tasks.addProject.getCall(0).args.should.deep.equal([app.sourceToAsanaMap().at(300), { projectId: app.sourceToAsanaMap().at(200) }]);
			client.tasks.addProject.getCall(1).args.should.deep.equal([app.sourceToAsanaMap().at(301), { projectId: app.sourceToAsanaMap().at(200) }]);
		});
	});

	describe("#_addTasksToTags", function() {
		it("should add the correct tag to a task", function() {
			exp.setMockData({
				tags: [{ sourceId: 100, name: "tag foo", sourceTeamId: null, sourceItemIds: [101] }],
				tasks: [{ sourceId: 101, name: "task foo", sourceFollowerIds: [], sourceItemIds: [] }]
			});

			importer._importTags();
			importer._importTasks();
			importer._addTasksToTags();

			client.tasks.addTag.should.have.been.calledOnce;
		});
	});

	describe("#_importUsers", function() {
		it("should add a user to the correct workspace", function() {
			exp.setMockData({
				users: [{ sourceId: 100, name: "mike", email: "mike@example.com" }]
			});

			importer._importUsers();

			client.workspaces.addUser.should.have.been.calledOnce;
			client.workspaces.addUser.should.have.been.calledWithExactly(importer.organizationId(), {
				user: "mike@example.com",
				opt_silent: true
			});
		});
	});

	describe("#_addAssigneesToTasks", function() {
		it("should set the assignee of a task", function() {
			exp.setMockData({
				users: [{ sourceId: 100, name: "user1", email: "user1@example.com" }],
				tasks: [{ sourceId: 101, name: "task1", sourceFollowerIds: [], sourceAssigneeId: 100 }]
			});

			importer._importTasks();
			importer._importUsers();
			importer._addAssigneesToTasks();

			client.tasks.update.should.have.been.calledOnce;
			client.tasks.update.should.have.been.calledWithExactly(app.sourceToAsanaMap().at(101), {
				assignee: app.sourceToAsanaMap().at(100),
				opt_silent: true
			});
		});
	});

	describe("#_addFollowersToTasks", function() {
		it("should add multiple followers to a task with a single request", function() {
			exp.setMockData({
				users: [
					{ sourceId: 100, name: "user1", email: "user1@example.com" },
					{ sourceId: 101, name: "user2", email: "user2@example.com" }
				],
				tasks: [{ sourceId: 200, name: "task1", sourceFollowerIds: [100, 101] }]
			});

			importer._importTasks();
			importer._importUsers();
			importer._addFollowersToTasks();

			client.tasks.addFollowers.should.have.been.calledOnce;
			client.tasks.addFollowers.should.have.been.calledWithExactly(app.sourceToAsanaMap().at(200), {
				followers: [100, 101].map(function(id) { return app.sourceToAsanaMap().at(id); }),
				opt_silent: true
			});
		});
	});

	describe("#_addMembersToTeams", function() {
		it("should add two members to a team with two API calls", function() {
			exp.setMockData({
				users: [
					{ sourceId: 100, name: "user1", email: "user1@example.com" },
					{ sourceId: 101, name: "user2", email: "user2@example.com" }
				],
				teams: [{ sourceId: 200, name: "team1", teamType: "PUBLIC", sourceMemberIds: [100, 101] }]
			});

			importer._importTeams();
			importer._importUsers();
			importer._addMembersToTeams();

			client.teams.addUser.should.have.been.calledTwice
			client.teams.addUser.should.have.been.calledWithExactly(app.sourceToAsanaMap().at(200), {
				user: app.sourceToAsanaMap().at(100),
				opt_silent: true
			});
		});
	});

	describe("#_addMembersToProjects", function() {
		it("should add two members to a project with one API call", function() {
			exp.setMockData({
				users: [
					{ sourceId: 100, name: "user1", email: "user1@example.com" },
					{ sourceId: 101, name: "user2", email: "user2@example.com" }
				],
				projects: [{ sourceId: 200, archived: false, name: "project1", sourceTeamId: null, sourceMemberIds: [100, 101] }]
			});

			importer._importTasks();
			importer._importUsers();
			importer._addMembersToProjects();

			client.projects.addMembers.should.have.been.calledOnce;
			client.projects.addMembers.should.have.been.calledWithExactly(app.sourceToAsanaMap().at(200), {
				members: [100, 101].map(function(id) { return app.sourceToAsanaMap().at(id); }),
				opt_silent: true
			});
		});
	});
});
