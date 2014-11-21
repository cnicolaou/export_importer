var aei = require("../");

var Story = module.exports = aei.ImportObject.extend().performSets({
	type: "Story",
	resourceName: "stories"
}).newSlots({
	text: null,
	sourceParentId: null,
	taskId: null
}).setSlots({
	_resourceData: function() {
		return {
			text: this.text()
		};
	},

	_createResource: function() {
		return aei.Future.withPromise(this._resource().createOnTask(this.taskId(), this._resourceData())).wait();
	},
});
