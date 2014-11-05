var fs = require("fs");
var ideal = require("ideal");

var aei = module.exports = {};

function requireDirectory(dirPath) {
    fs.readdirSync(__dirname + "/" + dirPath).forEach(function(fileName) {
        if (!fileName.endsWith(".js")) {
            return;
        }
        
        if (fileName == "index.js") {
            return;
        }
        
        aei[fileName.before(".js")] = require(dirPath + fileName);
    });
}

requireDirectory("./");