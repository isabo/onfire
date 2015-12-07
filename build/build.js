var compiler = require('closure-compiler');
var fs = require('fs-extra');

var options = {
    js: [
        'src/**.js',
        'node_modules/google-closure-library/closure/goog/**.js',
        '!src/externs/**.js'
    ],
    externs: [
        'node_modules/firebase-externs/firebase-externs.js',
        'src/externs/incoming/node-externs.js'
    ],
    jscomp_warning: 'missingRequire',
    jscomp_warning: 'useOfGoogBase',
    closure_entry_point: 'onfire',
    only_closure_dependencies: true,
    generate_exports: true,
    output_wrapper_file: 'build/wrapper.js',
    js_output_file: 'dist/onfire.min.js',
    create_source_map: '%outname%.map',
    source_map_location_mapping: [
        'src|../src',
        'node_modules|../node_modules'
    ],
    compilation_level: 'ADVANCED',
    warning_level: 'VERBOSE',
    summary_detail_level: '3'
};

compiler.compile(undefined, options, function(err, stdout, stderr) {

    console.log(stderr);

    console.log('Copying externs to dist/ ...');
    fs.copy('src/externs/outgoing/', 'dist/', function(err) {
        if (!err) {
            console.log('Done.\n');
        } else {
            console.error(err);
        }
    });
});
