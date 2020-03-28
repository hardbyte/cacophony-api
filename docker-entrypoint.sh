#!/bin/bash
set -e



echo "---- NOT Migrating database (do it manually) ----"
#node_modules/.bin/sequelize db:migrate --config config/config.js
#node_modules/.bin/sequelize db:seed:all --config config/config.js

# TODO just compile during build? once
./node_modules/.bin/tsc-watch --onSuccess "node Server.js --config=config/config.js"

