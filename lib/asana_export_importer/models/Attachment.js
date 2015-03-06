var aei = require("../");
var fs = require("fs");

var Attachment = module.exports = aei.ImportObject.extend().performSets({
    type: "Attachment",
    resourceName: "attachments"
}).newSlots({
    sourceParentId: null,
    taskId: null,

    // Some attachments have the property that they shouldn't be created. For example ones with trashed Tasks.
    skip: false
}).setSlots({
    _resourceData: function() {
        return {
            sourceId: this.sourceId(),
            task: this.taskId()
        };
    },

    create: function() {
        if (this.skip()) {
            return;
        }

        return fs.appendFile.futureWrap()(this.app().attachmentsPath(), JSON.stringify(this._resourceData()) + "\n").wait();
    }
});
