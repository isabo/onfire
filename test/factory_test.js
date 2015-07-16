var test = require('tape');
var MockFirebase = require('./mockfirebase').MockFirebase;
var onfire = require('./mockfirebase').onfire;


test('Fails with invalid property type', function (t) {

    var schema = {
        number: 'number',
        string: 'string',
        boolean: 'invalid'
    };

    t.throws(function () {
        onfire.defineModel(schema);
    }, 'Throws an error');

    t.end();
});


test('Fails with invalid config value', function (t) {

    t.throws(function () {
        onfire.defineModel('This is not a config');
    }, 'Throws an error');

    t.end();
});


test('Generates a simple model constructor', function (t) {

    var schema = {
        number: 'number',
        string: 'string',
        boolean: 'boolean'
    };

    var Model = onfire.defineModel(schema);

    t.ok(Model.prototype instanceof onfire.model.Model, 'Constructs subclass of onfire.model.Model');

    // Check for property getters/setters.
    for (var p in schema) {
        t.equal(typeof Model.prototype[p], 'function', 'Has method ' + p + '()');
    }
    t.end();
});


test('Generates a simple collection constructor', function (t) {

    var schema = {
        $id: 'boolean'
    };

    var Collection = onfire.defineModel(schema);

    t.ok(Collection.prototype instanceof onfire.model.Collection,
        'Constructs subclass of onfire.model.Collection');
    t.end();
});


test('Generates nested constructors for submodels', function (t) {

    var schema = {
        details: {
            name: 'string',
            age: 'number'
        },
        items: {
            $id: 'boolean'
        }
    };

    var Model = onfire.defineModel(schema);

    for (var p in schema) {
        t.equal(typeof Model.prototype[p], 'function', 'Has method ' + p + '()');

        // Check for constructors of the nested models.
        if (typeof schema[p] === 'object') {
            t.ok(Model.prototype[p + 'Ctor_'], 'Has nested constructor ' + p + 'Ctor_');
        }
    }

    t.end();
});


test('Uses pre-generated constructors for submodels', function (t) {

    var itemsCfg = {
        $id: 'boolean'
    };
    var ItemsCollection = onfire.defineModel(itemsCfg);

    var schema = {
        details: {
            name: 'string',
            age: 'number'
        },
        items: ItemsCollection
    };

    var Model = onfire.defineModel(schema);

    for (var p in schema) {
        t.equal(typeof Model.prototype[p], 'function', 'Has method ' + p + '()');

        // Check for constructors of the nested models.
        if (typeof schema[p] === 'object') {
            t.ok(Model.prototype[p + 'Ctor_'], 'Has nested constructor ' + p + 'Ctor_');
        }
    }

    t.end();
});
