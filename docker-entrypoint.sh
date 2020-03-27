#!/bin/bash
set -e

cd /app

echo "---- Compiling TypeScript ----"
node_modules/.bin/tsc

echo "---- Generating API doc ----"
npm run apidoc

echo "---- NOT Migrating database (do it manually) ----"
#node_modules/.bin/sequelize db:migrate --config config/config.js
#node_modules/.bin/sequelize db:seed:all --config config/config.js

./node_modules/.bin/tsc-watch --onSuccess "node Server.js --config=config/config.js"

