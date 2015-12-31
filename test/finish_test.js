var test = require('tape');

// Because Firebase is used in some of the tests, Node will not exit by itself.

test.onFinish(function() {
    process.exit();
});
