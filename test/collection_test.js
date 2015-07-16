var test = require('tape');
var MockFirebase = require('./mockfirebase').MockFirebase;
var onfire = require('./mockfirebase').onfire;

var rootRef = new MockFirebase('https://example.firebaseio.com');

test('Collection of primitives', function(t) {

    // Prepare the constructor.
    var schema = {
        '$id': 'boolean'
    };
    var ThingIds = onfire.defineModel(schema);

    // Prepare the database.
    var ref = rootRef.child('primitiveCollection');
    var testData = {
        'a': true,
        'b': false
    }
    ref.set(testData, function (err) {
        t.error(err, 'Test data prepared successfully');

        var thingIdsRef = new onfire.Ref(ref);

        try {
            var thingIds = new ThingIds(thingIdsRef);
        } catch (e) {
            t.fail('Failed to create an instance: ' + e);
        }


        // Test basic properties.
        t.equal(thingIds.key(), ref.key(), '.key() property works');
        t.equal(thingIds.exists(), false, '.exists() is false before loading');
        t.equal(thingIds.hasChanges(), false, '.hasChanges() is false before loading');
        t.equal(thingIds.count(), 0, '.count() is correct');
        t.deepEqual(thingIds.keys(), [], '.keys() is correct');


        thingIds.whenLoaded().
            then(function() {

                // Collect expected data values.
                var keys = [];
                for (var key in testData) {
                    keys.push(key);
                }
                var count = keys.length;

                // Test basic properties once it is loaded.
                t.equal(thingIds.count(), count, '.count() is correct');
                t.deepEqual(thingIds.keys(), keys, '.keys() is correct');

                // Get the primitive values.
                for (key in testData) {
                    t.equal(thingIds.get(key), testData[key], 'Retrieves correct value for ' + key);
                }


                t.end();
            });

    });
    ref.flush();
});
