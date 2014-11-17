var aei = require("./");
var fs = require("fs");

var Attachment = module.exports = aei.ImportObject.extend().performSets({
	type: "Attachment",
	resourceName: "attachments"
}).newSlots({
	sourceParentId: null,
	taskId: null
}).setSlots({
	_resourceData: function() {
		return {
			sourceId: this.sourceId(),
			task: this.taskId()
		};
	},

	create: function() {
		return fs.appendFile.futureWrap()(this.app().attachmentsPath(), JSON.stringify(this._resourceData()) + "\n");
	}
});
