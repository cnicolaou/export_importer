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
	"MockApiClient",
	"MockApiResource",
	"MockExport",
	"SourceToAsanaMap",
	"models/ImportObject",
	"models/Attachment",
	"models/Project",
	"models/Story",
	"models/Tag",
	"models/Task",
	"models/Team",
	"models/User"
].forEach(function(name) {
	module.exports[name.match(/[^\/]+$/)[0]] = require("./" + name);
});
