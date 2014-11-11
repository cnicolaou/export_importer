var ae = require("../lib/asana_export");
var aei = require("../lib/asana_export_importer");


/*
aei.Team.__replaceCreateWithFind(); //TODO
aei.Project.__replaceCreateWithFind(); //TODO
aei.Task.__replaceCreateWithFind(); //TODO
aei.Task.__replaceSetParentWithNoop(); //TODO
//*/

var app = aei.App.shared();
app.importer().setExport(ae.AsanaExport.clone().setPath(process.env.EXPORT_FILE_PATH));
app.setApiClient(aei.asana.Client.basicAuth(process.env.ASANA_API_KEY));
//app.setApiClient(aei.MockApiClient.clone()); //TODO
app.setAttachmentsPath(process.env.ATTACHMENTS_FILE_PATH || "db/attachments.json");
app.start().resolve(function(err){
	if (err) {
		console.log(err.stack || err);
	}
});