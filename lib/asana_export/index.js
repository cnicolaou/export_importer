var fs = require("fs");

module.exports = {};

function requireDirectory(dirPath) {
    fs.readdirSync(__dirname + "/" + dirPath).forEach(function(fileName) {
        if (!fileName.endsWith(".js")) {
            return;
        }
        
        if (fileName == "index.js") {
            return;
        }
        
        module.exports[fileName.before(".js")] = require(dirPath + fileName);
    });
}

module.exports.ideal = require("ideal");
module.exports.aei = require("../asana_export_importer");
module.exports.Future = require('fibers/future');

requireDirectory("./");