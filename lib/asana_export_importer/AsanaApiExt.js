var aei = require("./");

aei.asana.resources.Projects.prototype.addMembers = function(projectId, data) {
	return this.dispatcher.post('/projects/' + projectId + '/addMembers', data);
};

aei.asana.resources.Projects.prototype.addFollowers = function(projectId, data) {
	return this.dispatcher.post('/projects/' + projectId + '/addFollowers', data);
};

aei.asana.resources.Teams.prototype.create = function(data) {
	return this.dispatcher.post('/teams', data);
};

aei.asana.resources.Teams.prototype.addUser = function(teamId, data) {
	return this.dispatcher.post('/teams/' + teamId + '/addUser', data);
};

aei.asana.resources.Workspaces.prototype.addUser = function(workspaceId, data) {
	return this.dispatcher.post('/workspaces/' + workspaceId + '/addUser', data);
};
