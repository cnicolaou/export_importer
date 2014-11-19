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
				teams: [{ sourceId: 100, name: "team foo", teamType: "PUBLIC", sourceMemberIds: [] }],
				projects: [{ sourceId: 101, name: "project foo", sourceTeamId: 100, sourceMemberIds: [] }]
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
				tasks: [{ sourceId: 1, name: "task foo", sourceProjectIds: [], sourceTagIds: [], sourceFollowerIds: [] }]
			});

			importer._importTasks();

			client.tasks.create.should.have.been.calledOnce;
		});

		it("should create a task in a project", function() {
			exp.setMockData({
				teams: [{ sourceId: 100, name: "team foo", teamType: "PUBLIC", sourceMemberIds: [] }],
				projects: [{ sourceId: 101, name: "project foo", sourceTeamId: 100, sourceMemberIds: [] }],
				tasks: [{ sourceId: 102, name: "task foo", sourceProjectIds: [101], sourceTagIds: [], sourceFollowerIds: [] }]
			});

			importer._importTeams();
			importer._importProjects();
			importer._importTasks();

			client.tasks.create.should.have.been.calledOnce;
			client.tasks.create.getCall(0).args[0]['projects'].should.deep.equal([app.sourceToAsanaMap().at(101)])
		});
	});

	describe("#_importStories", function() {
		it("should add a story to the correct task", function() {
			exp.setMockData({
				tasks: [{ sourceId: 100, name: "task foo", sourceProjectIds: [], sourceTagIds: [], sourceFollowerIds: [] }],
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
		it("should update the subtask with the correct parent task ID", function() {
			exp.setMockData({
				tasks: [
					{ sourceId: 100, name: "task foo", sourceProjectIds: [], sourceTagIds: [], sourceFollowerIds: [] },
					{ sourceId: 101, name: "subtask foo", sourceProjectIds: [], sourceTagIds: [], sourceFollowerIds: [], sourceParentId: 100 }
				]
			});

			importer._importTasks();
			importer._addSubtasksToTasks();

			client.tasks.setParent.should.have.been.calledOnce;
			client.tasks.setParent.should.have.been.calledWithExactly(app.sourceToAsanaMap().at(101), { parent: app.sourceToAsanaMap().at(100) });
		});
	});

	describe("#_addTasksToTags", function() {
		it("should add the correct tag to a task", function() {
			exp.setMockData({
				tags: [{ sourceId: 100, name: "tag foo", sourceTeamId: null }],
				tasks: [{ sourceId: 101, name: "task foo", sourceProjectIds: [], sourceTagIds: [100], sourceFollowerIds: [] }]
			});

			importer._importTags();
			importer._importTasks();
			importer._addTasksToTags();

			client.tasks.addTag.should.have.been.calledOnce;
		});

		it("should not crash if a task doesn't exist", function() {
			exp.setMockData({
				tasks: [{ sourceId: 101, name: "task foo", sourceProjectIds: [], sourceTagIds: [100], sourceFollowerIds: [] }]
			});

			importer._importTags();
			importer._importTasks();
			importer._addTasksToTags();

			client.tasks.addTag.should.not.have.been.called;
		});
	});

	describe("#_importUsers", function() {
		it("should add a user to the correct workspace", function() {
			exp.setMockData({
				users: [{ sourceId: 100, name: "mike", email: "mike@example.com", asanaId: 100 }]
			});

			importer._importUsers();

			client.workspaces.addUser.should.have.been.calledOnce;
			client.workspaces.addUser.should.have.been.calledWithExactly(importer.organizationId(), { user: "mike@example.com", opt_silent: true });
		});
	});

	describe("#_addAssigneesToTasks", function() {
		it("", function() {
		});
	});

	describe("#_addFollowersToTasks", function() {
		it("", function() {
		});
	});

	describe("#_addMembersToTeams", function() {
		it("", function() {
		});
	});

	describe("#_addMembersToProjects", function() {
		it("", function() {
		});
	});
});
