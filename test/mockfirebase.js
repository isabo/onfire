// Replace Firebase with a mock, even in require()ed modules.
var proxyquire = require('proxyquire');
var MockFirebase = require('mockfirebase').MockFirebase;
var onfire = proxyquire('../dist/onfire.min', {
    firebase: function (url) {
        return (new MockFirebase(url));
    }
});

module.exports.MockFirebase = MockFirebase;
module.exports.onfire = onfire;
