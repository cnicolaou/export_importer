var aei = require("./");
var fs = require("fs");

var App = module.exports = aei.ideal.Proto.extend().setType("App").newSlots({
	importer: null,
	attachmentsPath: null,
	sourceToAsanaMap: null,
	client: null,
	clientCache: null,
	clientRetry: null
}).setSlots({
	shared: function() {
		if (!this._shared) {
			this._shared = App.clone();
		}
		return this._shared;
	},

	init: function() {
		this.setImporter(aei.Importer.clone());
		this.setSourceToAsanaMap(aei.SourceToAsanaMap.clone());
	},

	start: function() {
		var self = this;
		if (fs.existsSync(this.attachmentsPath())) {
			fs.unlinkSync(this.attachmentsPath());
		}
		return aei.Future.task(function(){
			self.importer().run();
		});
	},

	apiClient: function() {
		if (!this._apiClient) {
			this._apiClient = this.client();
			if (this.clientRetry()) {
				this._apiClient = this.clientRetry().setClient(this._apiClient);
			}
			if (this.clientCache()) {
				this._apiClient = this.clientCache().setClient(this._apiClient);
			}
		}
		return this._apiClient;
	},

	setClient: function(client) {
		delete this._apiClient;
		this._client = client;
	},
	setClientCache: function(clientCache) {
		delete this._apiClient;
		this._clientCache = clientCache;
	},
	setClientRetry: function(clientRetry) {
		delete this._apiClient;
		this._clientRetry = clientRetry;
	}
});

aei.ideal.Proto.app = function() {
	return App.shared();
};
