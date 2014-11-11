module.exports.ideal = require("ideal");
module.exports.Future = require("fibers/future");
module.exports.asana = require("asana");

[
	"App",
	"AsanaApiExt",
	"Cursor",
	"DateExt",
	"Export",
	"FutureExt",
	"Importer",
	"ImportObject",
		"Attachment",
		"Project",
		"Story",
		"Tag",
		"Task",
		"Team",
		"User",
	"MockApiClient",
	"MockApiResource"
].forEach(function(name) {
	module.exports[name] = require("./" + name);
});