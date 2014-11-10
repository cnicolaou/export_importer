var aei = require("./");

aei.asana.resources.Teams.prototype.create = function(data) {
  return this.dispatcher.post('/teams', data);
};

aei.asana.resources.Tasks.prototype.findByWorkspace = function(workspaceId, params) {
	console.log(workspaceId);
  return this.dispatcher.get('/workspaces/' + workspaceId + '/tasks', params);
};

aei.asana.resources.Tasks.prototype.setParent = function(taskId, data) {
  return this.dispatcher.post('/tasks/' + taskId + '/setParent', data);
};