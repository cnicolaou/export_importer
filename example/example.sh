#!/usr/bin/env bash

set -eu

# Asana user=asanabot@importsandbox.alexd-test-subdomain.asana.com password=a5anab0t
export ASANA_API_KEY="5PUmeLPC.tJAE8kFo3vduEtXW9kSgw8x"
export ASANA_ORGANIZATION="20556533848969"

npm install
npm test

mkdir -p db
rm -f db/importer.sqlite3

bin/asana_export_importer --api-key=$ASANA_API_KEY --organization=$ASANA_ORGANIZATION example/export.json
