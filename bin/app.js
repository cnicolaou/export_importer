var ideal = require("ideal");
var asana = require("asana");

var aei = require("../lib/asana_export_importer");

//*
var app = aei.App.shared();
app.importer().setAsanaApiKey(process.env.ASANA_API_KEY);
app.importer().setImportFilePath(process.env.IMPORT_FILE_PATH);

(function(){
	app.start();
}.future())();

//*/