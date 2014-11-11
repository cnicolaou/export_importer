var aei = require("./");

var SourceToAsanaMap = module.exports = aei.ideal.Proto.extend().setType("SourceToAsanaMap").newSlots({
}).setSlots({
    init: function() {
        this._map = {};
    },

    at: function(sourceId) {
        return this._map[sourceId] || null;
    },

    atPut: function(sourceId, asanaId) {
        this._map[sourceId] = asanaId;
    }
});