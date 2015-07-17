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
                t.ok(thingIds.containsKey(keys[0]), '.containsKey() returns true for an existing key');
                t.notOk(thingIds.containsKey('nosuchkey'), '.containsKey() returns false for non-existent key');

                // Get the primitive values.
                for (key in testData) {
                    t.equal(thingIds.get(key), testData[key], 'Retrieves correct value for ' + key);
                }

                // These should trigger errors.
                t.throws(function(){thingIds.getModel(keys[0])}, Error,
                    'Throws an exception when trying to retrieve a model instead of a primitive');
                t.throws(function(){thingIds.fetch(keys[0])}, Error,
                    'Throws an exception when trying to fetch a model instead of a primitive');
                t.throws(function(){thingIds.create()}, Error,
                    'Throws an exception when trying to create a model instead of a primitive');
                t.throws(function(){thingIds.fetchOrCreatecreate('newkey')}, Error,
                    'Throws an exception when trying to fetchOrCreate a model instead of a primitive');
                t.throws(function(){thingIds.get('nosuchkey')}, Error,
                    'Throws an exception when trying to retrieve a nonexistent item');


                t.end();
            });

    });
    ref.flush();
});


// Add, remove
// Model values
// forEach
// Does it pick up added/removed items?
