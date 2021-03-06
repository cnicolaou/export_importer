var aei = require("./");

var MockExportData = aei.ideal.Proto.extend().setType("MockExportData").newSlots({
    users: [],
    teams: [],
    projects: [],
    tags: [],
    tasks: [],
    attachments: []
});

var MockExport = module.exports =  aei.Export.extend().newSlots({
    data: null,
}).setSlots({
    setMockData: function(data) {
        this.data().performSets(data);
    },

    init: function() {
        this.setData(MockExportData.clone());
    },

    prepareForImport: function() {
    },

    cleanupAfterImport: function() {
    },

    users: function() {
        return this.data().users().map(function(user) {
            return aei.User.clone().performSets(user)
        });
    },

    teams: function() {
        return this.data().teams().map(function(team) {
            return aei.Team.clone().performSets(team)
        });
    },

    projects: function() {
        return this.data().projects().map(function(project) {
            return aei.Project.clone().performSets(project);
        });
    },

    tags: function() {
        return this.data().tags().map(function(project) {
            return aei.Tag.clone().performSets(project);
        });
    },

    taskDataSource: function() {
        var self = this;
        return function(position, chunkSize) {
            return self.data().tasks().slice(position, position + chunkSize).map(function(task) {
                return aei.Task.clone().performSets(task);
            });
        };
    },

    attachmentDataSource: function() {
        var self = this;
        return function(position, chunkSize) {
            return self.data().attachments().slice(position, position + chunkSize).map(function(task) {
                return aei.Attachment.clone().performSets(task);
            });
        };
    }
});
