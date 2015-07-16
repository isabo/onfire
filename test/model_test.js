var test = require('tape');
var MockFirebase = require('./mockfirebase').MockFirebase;
var onfire = require('./mockfirebase').onfire;

var rootRef = new MockFirebase('https://example.firebaseio.com');


test('Simple model', function (t) {

    // Prepare the constructor.
    var schema = {
        number: 'number',
        string: 'string',
        boolean: 'boolean'
    };
    var Thing = onfire.defineModel(schema);

    // Prepare the database.
    var ref = rootRef.child('simpleModel');
    var testData = {
        number: 2,
        string: 'Hello',
        boolean: true
    }
    ref.set(testData, function (err) {
        t.error(err, 'Test data prepared successfully');

        var thingRef = new onfire.Ref(ref);

        try {
            var thing = new Thing(thingRef);
        } catch (e) {
            t.fail('Failed to create an instance: ' + e);
        }

        // Test basic properties.
        t.equal(thing.key(), 'simpleModel', '.key() property works');
        t.equal(thing.exists(), false, '.exists() is false before loading');
        t.equal(thing.hasChanges(), false, '.hasChanges() is false before loading');

        thing.whenLoaded().
            then(function() {

                t.equal(thing.exists(), true, '.exists() is true after loading');
                t.equal(thing.hasChanges(), false, '.hasChanges() is still false after loading');

                for (var p in testData) {
                    t.equal(thing[p](), testData[p], p + ' === ' + testData[p]);
                }
            }, function(err) {
                t.error(err);
            });

        t.end();
    });
    ref.flush();
});

// Pass a non-ref to model constructor --> exception.
// .get('non-existent property') --> throws exception.
// .getBasicValue('non-existent property') --> throws exception.
// .getModel('non-existent property or not a model') --> throws exception.
// Missing boolean = false;
