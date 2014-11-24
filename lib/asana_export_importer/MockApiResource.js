var aei = require("./");

var Promise = require("bluebird");

function noOp() {
	return Promise.resolve({});
}

function create() {
	this.setCounter(this.counter() + 1);
	return Promise.resolve({ id: this.counter() });
}

var MockApiResource = module.exports = aei.ideal.Proto.extend().setType("MockApiResource").newSlots({
	name: null,
	counter: 0
}).setSlots({
	// common
	create: create,
	update: noOp,

	// stories
	createOnTask: create,

	// tags
	createInWorkspace: create,

	// tasks
	setParent: noOp,
	addTag: noOp,
	addFollowers: noOp,
	addProject: noOp,

	// projects
	addUser: noOp,

	// teams
	addMembers: noOp,

	// workspaces
	addUser: create
});
