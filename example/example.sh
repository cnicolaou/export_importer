#!/usr/bin/env bash

set -eu

npm install
npm test

mkdir -p db
rm -f db/importer.sqlite3

bin/asana_export_importer --api-key=$ASANA_API_KEY --organization=$ASANA_ORGANIZATION example/export.json
