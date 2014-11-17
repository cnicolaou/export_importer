Asana Export Importer
=====================

Setup
-----

1. Ensure Node.js v0.10 and SQLite3 are installed.
2. In the project directory run:

    npm install

Example
-------

    bin/asana_export_importer example/export.json

You can also specify an importer, organization ID to import into, and Asana API key and endpoint. The following are the defaults:

	bin/asana_export_importer --importer=asana_export --organization=8737056890891 --api-key=5IhOYQE4.CpDycmK7AssYDix0zIvsgVn --api-endpoint=https://app.asana.com/api/1.0 example/export.json
