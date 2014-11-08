var ae = require("../lib/asana_export");
var aei = require("../lib/asana_export_importer");

//*

//aei.Team.__replaceCreateWithFind(); //TODO
//aei.Project.__replaceCreateWithFind(); //TODO

var app = aei.App.shared();
app.importer().setExport(ae.AsanaExport.clone().setPath(process.env.EXPORT_FILE_PATH));
app.setApiClient(aei.asana.Client.basicAuth(process.env.ASANA_API_KEY));
//app.setApiClient(aei.MockApiClient.clone()); //TODO
app.start().resolve(function(err){
	if (err) {
		console.log(err.stack || err);
	}
});

//*/