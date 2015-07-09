var test = require('tape');
var MockFirebase = require('./mockfirebase').MockFirebase;


var fb = new MockFirebase('https://example.firebaseio.com');
var ref = new onfire.Ref(fb);
var child = ref.child('x').child('y');
var pushedRef;


test('onfire.Ref - basic ops', function (t) {

    t.equal(ref.key(), null, 'onfire.Ref.key() returns null for the root');
    t.equal(ref.path(), '/', 'onfire.Ref.path() returns / for root');

    t.equal(child.path(), '/x/y', 'onfire.Ref.path() returns a path');
    t.equal(child.key(), 'y', 'onfire.Ref.key() returns a key');

    t.equal(child.parent().path(), '/x', 'onfire.Ref.parent() returns parent');
    t.equal(child.root().path(), '/', 'onfire.Ref.root() returns the root');

    t.equal(typeof ref.generateId(), 'string', 'onfire.Ref.generateId() returns a string');
    t.notEquals(ref.generateId(), ref.generateId(), 'onfire.Ref.generateId() generates unique IDs');

    t.end();
});


test('onfire.Ref.push()', function (t) {

    var toPush = 'Pushed Value';

    t.plan(3);
    child.push(toPush).
        then(function (valueRef) {
            t.pass('Fulfils promise');
            t.ok(valueRef instanceof onfire.Ref, 'Resolves to an onfire.Ref');
            t.equal(valueRef.ref().getData(), toPush, 'Stores the value correctly');

            pushedRef = valueRef;

        }, function (err) {
            t.error(err, 'An error occurred!');
        });
    child.ref().flush();
});


test('onfire.Ref.once()', function (t) {

    t.plan(2);
    pushedRef.once('value').
        then(function (snapshot) {
            t.pass('Fulfils promise');
            t.equal(snapshot.val(), pushedRef.ref().getData(), 'Resolves to the correct value');
        }, function (err) {
            t.error(err, 'An error occurred!');
        });
    pushedRef.ref().flush();
});


test('onfire.Ref.onceValue()', function (t) {

    t.plan(2);
    pushedRef.onceValue().
        then(function (value) {
            t.pass('Fulfils promise');
            t.equal(value, pushedRef.ref().getData(), 'Resolves to the correct value');
        }, function (err) {
            t.error(err, 'An error occurred!');
        });
    pushedRef.ref().flush();
});


test('onfire.Ref.set()', function (t) {

    var toSet = 'Set Value';

    t.plan(3);
    pushedRef.set(toSet).
        then(function (value) {
            t.pass('Fulfils promise');
            t.equal(value, null, 'Resolves to null');
            t.equal(pushedRef.ref().getData(), toSet, 'Stores the value correctly');
        }, function (err) {
            t.error(err, 'An error occurred!');
        });
    pushedRef.ref().flush();
});


test('onfire.Ref.update()', function (t) {

    var toUpdate = {
        'firstName': 'John',
        'lastName': 'Smith'
    };

    t.plan(3);
    pushedRef.update(toUpdate).
        then(function (value) {
            t.pass('Fulfils promise');
            t.equal(value, null, 'Resolves to null');
            t.deepEqual(pushedRef.ref().getData(), toUpdate, 'Stores the value correctly');
        }, function (err) {
            t.error(err, 'An error occurred!');
        });
    pushedRef.ref().flush();
});


test('onfire.Ref.remove()', function (t) {

    t.plan(3);
    pushedRef.remove().
        then(function (value) {
            t.pass('Fulfils promise');
            t.equal(value, null, 'Resolves to null');
            t.equal(pushedRef.ref().getData(), null, 'Stores the value correctly');
        });
    pushedRef.ref().flush();
});


test('onfire.Ref.transaction()', function (t) {

    toUpdate = {
        'firstName': 'Fred',
        'lastName': 'Bloggs'
    };

    t.plan(4);
    pushedRef.transaction(function (value) {
        if (value === null) {
            return toUpdate;
        }
    }).
    then(function (value) {
        t.pass('Fulfils promise', value);
        t.equal(value.isCommitted, true, 'Was committed');
        t.deepEqual(value.snapshot.val(), toUpdate, 'Returns snapshot correctly');
        t.deepEqual(pushedRef.ref().getData(), toUpdate, 'Stores the value correctly');
    });
    pushedRef.ref().flush();
});

// TODO: on, off.
