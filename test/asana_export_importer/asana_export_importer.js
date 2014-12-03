
var asana_export_importer = require("../../bin/asana_export_importer");

describe("asana_export_importer", function() {
	beforeEach(function() {
		createApp();
	});

	describe("#parseOptions", function() {
		it("should parse with the minimal set of options, with defaults", function() {
			process.argv = ["node", "asana_export_importer",
				"--api-key=key",
				"--organization=0",
				"path"
			];

			var options = asana_export_importer.parseOptions();

			expect(options.path).to.equal("path");
			expect(options.module).to.equal("asana_export");
			expect(options.organization).to.equal(0);
			expect(options.apiKey).to.equal("key");
			expect(options.apiEndpoint).to.equal(aei.asana.Dispatcher.ROOT_URL);
			expect(options.attachmentsPath).to.equal("db/attachments.json");
			expect(options.databasesPath).to.equal("db");
			expect(options.retries).to.equal(5);
			expect(options.retryDelay).to.equal(500);
			expect(options.retryBackoff).to.equal(2);
			expect(options.resumable).to.equal(true);
			expect(options.concurrency).to.equal(1000);
			expect(options.batchSize).to.equal(100);
		});

		it("should parse all options correctly", function() {
			process.argv = ["node", "asana_export_importer",
				"--api-key=key",
				"--organization=1111",
				"--importer=something",
				"--api-endpoint=http://example.com/",
				"--attachments=db/attachments1.json",
				"--databases=db1",
				"--retries=2222",
				"--retry-delay=3333",
				"--retry-backoff=4444",
				"--resumable=false",
				"--concurrency=5555",
				"--batch-size=6666",
				"path"
			];

			var options = asana_export_importer.parseOptions();

			expect(options.path).to.equal("path");
			expect(options.module).to.equal("something");
			expect(options.organization).to.equal(1111);
			expect(options.apiKey).to.equal("key");
			expect(options.apiEndpoint).to.equal("http://example.com/");
			expect(options.attachmentsPath).to.equal("db/attachments1.json");
			expect(options.databasesPath).to.equal("db1");
			expect(options.retries).to.equal(2222);
			expect(options.retryDelay).to.equal(3333);
			expect(options.retryBackoff).to.equal(4444);
			expect(options.resumable).to.equal(false);
			expect(options.concurrency).to.equal(5555);
			expect(options.batchSize).to.equal(6666);
		});
	});

	describe("#initApp", function() {
		it("should initialize app with correct options", function() {
			process.argv = ["node", "asana_export_importer",
				"--api-key=key",
				"--organization=1111",
				"--api-endpoint=http://example.com/",
				"--attachments=db/attachments1.json",
				"--databases=db1",
				"--retries=0",
				"--resumable=false",
				"--concurrency=5555",
				"--batch-size=6666",
				"path"
			];

			var app = asana_export_importer.initApp(asana_export_importer.parseOptions());

			expect(app.importer().export().path()).to.equal("path");
			expect(app.importer().organizationId()).to.equal(1111);
			expect(app.apiClient().dispatcher.authValue.user).to.equal("key");
			expect(aei.asana.Dispatcher.ROOT_URL).to.equal("http://example.com/");
			expect(app.attachmentsPath()).to.equal("db/attachments1.json");
			expect(app.sourceToAsanaMap().dbPath()).to.equal("db1/mapping.sqlite");

			expect(app.clientCache()).to.equal(null);
			expect(app.clientRetry()).to.equal(null);

			expect(app.importer().concurrency()).to.equal(5555);
			expect(app.importer().export().batchSize()).to.equal(6666);
		});
	});

	describe("#initApp", function() {
		it("should set the cache and retry middleware parameters", function() {
			process.argv = ["node", "asana_export_importer",
				"--api-key=key",
				"--organization=1111",
				"--databases=db1",
				"--retries=2222",
				"--retry-delay=3333",
				"--retry-backoff=4444",
				"--resumable=true",
				"path"
			];

			var app = asana_export_importer.initApp(asana_export_importer.parseOptions());

			expect(app.clientCache()).to.not.equal(null);
			expect(app.clientCache().dbPath()).to.equal("db1/cache.sqlite");

			expect(app.clientRetry()).to.not.equal(null);
			expect(app.clientRetry().retries()).to.equal(2222);
			expect(app.clientRetry().delay()).to.equal(3333);
			expect(app.clientRetry().backoff()).to.equal(4444);
		});
	});
});
