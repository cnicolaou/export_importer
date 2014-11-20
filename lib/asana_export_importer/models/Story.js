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
		return this._resource().createOnTask(this.taskId(), this._resourceData());
	},

	//This will find existing teams instead of creating new ones.  Useful for development.
	__replaceCreateWithFind: function() {
		this._createResource = function() {
			var self = this;

			var story = aei.Future.withPromise(this._resource().findByTask(this.taskId())).wait().detect(function(obj){
				return obj.target.id == self.taskId()
			});

			return {
				then: function(fn) {
					setImmediate(function(){
						fn(story);
					});
				},

				error: function() {
				}
			}
		}
	}
});
