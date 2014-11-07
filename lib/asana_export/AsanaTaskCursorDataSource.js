var ae = require("./");

var AsanaTaskCursorDataSource = module.exports = ae.ideal.Proto.extend().newSlots({
	db: null
}).setSlots({
	//returns a task
	nextChunk: function(position, chunkSize) {
		var self = this;
		return this.db().findByType("Task", position, chunkSize).map(function(obj){
			return ae.aei.Task.clone().performSets({
				sourceId: obj.__object_id,
				assigneeStatus: obj.assignee_status,
				completed: obj.completed !== undefined,
				dueOn: obj.due_on,
				hearted: obj.hearted,
				name: obj.name,
				notes: obj.notes,
				sourceProjectIds: self.db().findParentsByType(obj.__object_id, "ItemList").filterProperty("is_project", true).mapProperty("__object_id")
			});
		});
	}
});