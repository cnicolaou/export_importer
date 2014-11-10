module.exports.ideal = require("ideal");
module.exports.Future = require("fibers/future");
module.exports.asana = require("asana");

[
	"App",
	"AsanaApiExt",
	"Cursor",
	"Export",
	"FutureExt",
	"Importer",
	"ImportObject",
		"Attachment",
		"Project",
		"Story",
		"Task",
		"Team",
	"MockApiClient",
	"MockApiResource"
].forEach(function(name) {
	module.exports[name] = require("./" + name);
});