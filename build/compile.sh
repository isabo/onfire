#!/bin/bash

cd "$(dirname "$0")"

echo "Compiling ..."
java -server -jar ../node_modules/google-closure-compiler/compiler.jar \
--compilation_level ADVANCED \
--warning_level VERBOSE \
--summary_detail_level 3 \
--jscomp_warning missingRequire \
--jscomp_warning useOfGoogBase \
--generate_exports \
--closure_entry_point onfire \
--only_closure_dependencies \
--externs '../node_modules/firebase-externs/firebase-externs.js' \
--externs '../src/externs/incoming/node-externs.js' \
--js_output_file '../dist/onfire.min.js' \
--create_source_map '../dist/%outname%.map' \
--source_map_location_mapping '../node_modules|../..' \
--output_wrapper '(function(){%output%})();//# sourceMappingURL=./onfire.min.js.map' \
--js '../src/**.js' \
--js '../node_modules/google-closure-library/closure/goog/**.js' \
--js '!../src/**_test.js' \
--js '!../src/externs/**.js' \
--js '!../node_modules/google-closure-library/closure/goog/**_test.js' \
--js '!../node_modules/google-closure-library/closure/goog/demos/**.js'

echo "Copying externs ..."
cp ../src/externs/outgoing/*.js ../dist
