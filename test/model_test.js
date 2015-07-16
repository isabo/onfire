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

                // Test basics after loading.
                t.equal(thing.exists(), true, '.exists() is true after loading');
                t.equal(thing.hasChanges(), false, '.hasChanges() is still false after loading');

                // Test the getters.
                for (var p in testData) {
                    t.equal(thing[p](), testData[p], '.' + p + '() === ' + testData[p]);
                    t.equal(thing.get(p), testData[p], '.get(' + p + ') === ' + testData[p]);
                }

                // Test the setters.
                for (p in schema) {
                    var current = thing[p]();
                    var toAssign;
                    switch (schema[p]) {
                        case 'number':
                            toAssign = current+1;
                            break;
                        case 'string':
                            toAssign = current+'x';
                            break;
                        case 'boolean':
                            toAssign = !current;
                    }
                    thing[p](toAssign);
                }

                t.ok(thing.hasChanges(), 'Model has outstanding changes');

                thing.save().then(function() {
                    // Compare the model's values with the expected values.
                    for (var p in schema) {
                        switch (schema[p]) {
                            case 'number':
                                expected = testData[p]+1;
                                break;
                            case 'string':
                                expected = testData[p]+'x';
                                break;
                            case 'boolean':
                                expected = !testData[p];
                        }
                        t.equal(thing[p](), expected, '.' + p + '(value) updates model correctly');
                        t.equal(ref.child(p).getData(), expected, '.' + p + '(value) updates database correctly');
                    }

                }, function(err) {
                    t.error(err, 'Failed to save the changes');
                });



            }, function(err) {
                t.error(err);
            }).
            then(function() {
                t.end();
            });
    });
    ref.flush();
});

// Pass a non-ref to model constructor --> exception.
// .get('non-existent property') --> throws exception.
// .getBasicValue('non-existent property') --> throws exception.
// .getModel('non-existent property or not a model') --> throws exception.
// Missing boolean = false; Missing number = 0? --> only with a definition of default in schema? string=''?
// overloaded getter name: warning when generating constructor, still works with get/set.
