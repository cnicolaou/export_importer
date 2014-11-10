var aei = require("./");

var User = module.exports = aei.ImportObject.extend().performSets({
	type: "User",
	resourceName: "users"
}).newSlots({
	name: null
}).setSlots({
});