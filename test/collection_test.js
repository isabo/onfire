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
        t.equal(thingIds.hasChanges(), false, '.hasChanges() is false before loading');
        t.throws(function(){thingIds.exists()}, Error, '.exists() throws an exception before loading');
        t.throws(function(){thingIds.count()}, Error, '.count() throws an exception before loading');
        t.throws(function(){thingIds.keys()}, Error, '.keys() throws an exception before loading');

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
                t.notOk(thingIds.containsKey('nosuchkey'),
                    '.containsKey() returns false for non-existent key');

                // These should trigger errors.
                t.throws(function(){thingIds.getModel(keys[0])}, Error,
                    'Throws an exception when trying to retrieve a model instead of a primitive');
                t.throws(function(){thingIds.fetch(keys[0])}, Error,
                    'Throws an exception when trying to fetch a model instead of a primitive');
                t.throws(function(){thingIds.create()}, Error,
                    'Throws an exception when trying to create a model instead of a primitive');
                t.throws(function(){thingIds.fetchOrCreate('newkey')}, Error,
                    'Throws an exception when trying to fetchOrCreate a model instead of a primitive');
                t.throws(function(){thingIds.set('modelKey', new onfire.model.Model(ref))}, Error,
                    'Throws an exception when trying to .set() a model instead of a primitive');
                t.throws(function(){thingIds.get('nosuchkey')}, Error,
                    'Throws an exception when trying to retrieve a nonexistent item');

                // Get the primitive values.
                for (key in testData) {
                    t.equal(thingIds.get(key), testData[key], 'Retrieves correct value for ' + key);
                }

            }, function(err) {
                t.error(err, 'Failed to load the model instance');
            }).
            then(function() {
                t.doesNotThrow(function(){thingIds.set('c', true)}, Error,
                    '.set() works on a primitive collection');
                t.notOk(thingIds.containsKey('c'),
                    '.containsKey() returns false for a not-yet-saved key');
                t.equal(thingIds.hasChanges(), true, '.hasChanges() is true after .set()');

                var p = thingIds.save().
                    then(function() {
                        t.ok(thingIds.containsKey('c'),
                            '.containsKey() returns true for a newly-saved key');
                        t.equal(thingIds.get('c'), true,
                            'Newly saved primitive value is correct');
                    }, function(err) {
                        t.error(err, '.save() failed');
                    });
                ref.flush();
                return p;
            }).
            then(function() {

                t.doesNotThrow(function(){thingIds.remove('nosuchkey')}, Error,
                    'Does not throw exception when attempting to remove non-existent key');

                var p = thingIds.remove('c').
                    then(function() {
                        t.notOk(thingIds.containsKey('c'),
                            '.containsKey() returns false for a removed key');
                        t.throws(function(){thingIds.get('c')}, Error,
                            '.get() throws an error on a removed key');
                    }, function(err) {
                        t.error(err, '.remove() failed');
                    });
                setTimeout(function() {
                    ref.flush()
                });
                return p;

            }, function(err) {
                t.error(err, 'Something went wrong with the .set() tests');
            }).
            then(undefined, function(err) {
                t.error(err, 'Something went wrong with the .remove() tests');
            }).
            then(function() {
                t.end();
            });

    });
    ref.flush();
});

test('Collection of objects', function(t) {

    // Prepare the constructor.
    var schema = {
        '$id': {
            name: 'string'
        }
    };
    var Things = onfire.defineModel(schema);

    // Prepare the database.
    var ref = rootRef.child('things');
    var testData = {
        'one': {
            'name': 'One'
        },
        'two': {
            'name': 'Two'
        },
    }
    ref.set(testData, function(err) {
        t.error(err, 'Test data prepared successfully');

        var thingsRef = new onfire.Ref(ref);

        try {
            var things = new Things(thingsRef);
        } catch (e) {
            t.fail('Failed to create an instance: ' + e);
        }


        // Test basic properties.
        t.equal(things.key(), ref.key(), '.key() property works');
        t.equal(things.hasChanges(), false, '.hasChanges() is false before loading');
        t.throws(function(){thingIds.exists()}, Error, '.exists() throws an exception before loading');
        t.throws(function(){thingIds.count()}, Error, '.count() throws an exception before loading');
        t.throws(function(){thingIds.keys()}, Error, '.keys() throws an exception before loading');

        things.whenLoaded().
            then(function() {
                // Collect expected data values.
                var keys = [];
                for (var key in testData) {
                    keys.push(key);
                }
                var count = keys.length;

                // Test basic properties once it is loaded.
                t.equal(things.count(), count, '.count() is correct');
                t.deepEqual(things.keys(), keys, '.keys() is correct');
                t.ok(things.containsKey(keys[0]), '.containsKey() returns true for an existing key');
                t.notOk(things.containsKey('nosuchkey'),
                    '.containsKey() returns false for non-existent key');

                // These should trigger errors.
                t.throws(function(){things.set('c', true)}, Error,
                    '.set() fails on a non-primitive collection');
                t.throws(function(){things.get('nosuchkey')}, Error,
                    'Throws an exception when trying to get a nonexistent item');
                t.throws(function(){things.fetch('nosuchkey')}, Error,
                    'Throws an exception when trying to fetch a nonexistent item');

                // Get and fetch the items.
                var promises = [];
                for (key in testData) {
                    var thing = things.get(key);
                    t.ok(thing instanceof onfire.model.Model,
                        '.get(' + key + ') returns a model instance');
                    t.ok(things.getModel(key) instanceof onfire.model.Model,
                        '.getModel(' + key + ') returns a model instance');
                    t.deepEqual(things.getBasicValue(key), testData[key],
                        '.getBasicValue(' + key + ') returns the correct value');

                    // Wrapped in a function to preserve the loop values at each iteration for the
                    // corresponding callback.
                    (function checkGetters(thing, key) {
                        var p = things.fetch(key).
                            then(function(thing) {
                                for (mk in testData[key]) {
                                    t.equal(thing[mk](), testData[key][mk],
                                        'thing.' + mk + '() === ' + testData[key][mk]);
                                }
                            });
                        promises.push(p);
                        ref.flush();
                    })(thing, key);
                }

                return Promise.all(promises);

            }, function(err) {
                t.error(err, 'Failed to load the collection instance');
            }).
            then(function() {
                // Test .create()
                var p = things.create({name: 'Three'}).
                    then(function(three) {
                        t.ok(three instanceof onfire.model.Model,
                            '.create() resolves to a Model instance');
                        t.equal(three.name(), 'Three', '.create() initialises new member correctly');
                        t.equal(things.count(), 3, 'count() has been increased by 1');

                        // Retrieve newly created item from the collection.
                        var p = things.fetch(things.keys()[2]).
                            then(function(three) {
                                t.ok(three instanceof onfire.model.Model,
                                    '.create() places a Model instance in the collection');
                                t.equal(three.name(), 'Three',
                                    '.create() places correctly initialised model in the collection');
                            });
                        ref.flush();
                        return p;
                    }, function(err) {
                        t.error(err, '.create() failed');
                    });
                ref.flush();
                setTimeout(function() {
                    ref.flush()
                });
                return p;
            }).
            then(function() {
                // Test .fetchOrCreate() when item needs to be created.
                var p = things.fetchOrCreate('d', {name: 'Four'}).
                    then(function(four){
                        t.ok(four instanceof onfire.model.Model,
                            '.fetchOrCreate() resolves to a Model instance');
                        t.equal(four.name(), 'Four', '.fetchOrCreate() initialises new member correctly');
                        t.equal(things.count(), 4, 'count() has been incremented by 1');

                        // Retrieve newly created item from the collection.
                        var p = things.fetch('d').
                            then(function(four) {
                                t.ok(four instanceof onfire.model.Model,
                                    '.fetchOrCreate() places a Model instance in the collection');
                                t.equal(four.name(), 'Four',
                                    '.fetchOrCreate() places correctly initialised model in the collection');
                            });
                        ref.flush();
                        return p;
                    });
                ref.flush();
                setTimeout(function() {
                    ref.flush()
                });
                return p;
            }).
            then(function() {
                // Test .fetchOrCreate() when item already exists.
                var p = things.fetchOrCreate('d', {name: 'Five'}).
                    then(function(four){
                        t.ok(four instanceof onfire.model.Model,
                            '.fetchOrCreate() resolves to an existing Model instance');
                        t.equal(four.name(), 'Four',
                            '.fetchOrCreate() does not change an existing model');
                        t.equal(things.count(), 4, 'count() has not been incremented');
                    }, function(err) {
                        t.error(err, '.fetchOrCreate() failed');
                    });
                ref.flush();
                setTimeout(function() {
                    ref.flush()
                });
                return p;
            }).
            then(function() {
                // Test .remove()
                var p = things.remove('d').
                    then(function() {
                        t.equal(things.count(), 3, 'count() has been decremented');
                    }, function(err) {
                        t.error(err, '.remove() failed');
                    });
                ref.flush();
                setTimeout(function() {
                    ref.flush()
                });
                return p;
            }).
            then(function() {
                // Test .remove() a non-existent item.
                var p = things.remove('c').
                    then(function() {
                        t.equal(things.count(), 3, 'count() has not been decremented');
                    }, function(err) {
                        t.error(err, '.remove() a non-existent member should not reject with an error');
                    });
                return p;
            }).
            then(function() {
                t.end();
            });
    });

    ref.flush();
});

test('Read Permission Denied', function(t) {

    var schema = {
        '$id': 'boolean'
    };
    var ThingIds = onfire.defineModel(schema);

    var ref = rootRef.child('primitiveCollection');
    var thingIdsRef = new onfire.Ref(ref);
    // Make sure our listening will fail.
    ref.failNext('once', new Error());
    var thingIds = new ThingIds(thingIdsRef);

    thingIds.whenLoaded().
        then(function() {
            t.fail('Load succeeded when it should have failed');
        }, function(err) {
            t.pass('Load fails when permission denied');
        }).
        then(function() {
            t.end();
        });
    ref.flush();
});

// forEach
// Does it pick up added/removed items?
