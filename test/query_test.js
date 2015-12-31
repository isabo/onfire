var onfire = require('../dist/onfire.min');

var test = require('tape');
var Firebase = require('firebase');
var FirebaseServer = require('firebase-server');



test('Query collection', function(t) {

    // Prepase the data.
    var testData = {
        things: {
            one: {
                name: 'One'
            },
            two: {
                name: 'Two'
            },
            three: {
                name: 'Three'
            }
        }
    }

    // Fire up a local test server.
    var server = new FirebaseServer(5000, '127.0.1', testData);

    // Prepare the constructor.
    var schema = {
        '$id': {
            name: 'string'
        }
    };
    var Things = onfire.defineModel(schema);

    // Load a query into a collection.
    var rootRef = new Firebase('ws://127.0.1:5000');
    var queryRef = new onfire.Ref(rootRef.child('things').orderByKey().limitToLast(2));

    try {
        var someThings = new Things(queryRef);
    } catch (e) {
        t.fail('Failed to create an instance: ' + e);
    }


    t.equal(someThings.key(), 'things', '.key() property is correct');

    someThings.whenLoaded().
        then(function() {

            // Test basic properties once it is loaded.
            t.equal(someThings.count(), 2, '.count() is correct');
            t.deepEqual(someThings.keys(), ['three', 'two'], '.keys() is correct');
            t.ok(someThings.containsKey('two'), '.containsKey() returns true for an existing key');
            t.notOk(someThings.containsKey('one'),
                '.containsKey() returns false for key that is not in the query window');

        }, function(err) {
            t.error(err, 'Failed to load the collection instance');
        }).
        then(function() {
            someThings.dispose();
            someThings = null;
            rootRef = null;
            queryRef = null;
            server.close(function() {
                server = null;
                t.end();
            });
        });
});
