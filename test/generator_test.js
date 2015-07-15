var test = require('tape');
var MockFirebase = require('./mockfirebase').MockFirebase;
var onfire = require('./mockfirebase').onfire;


test('Fails with invalid property type', function (t) {

    var cfg = {
        number: 'number',
        string: 'string',
        boolean: 'invalid'
    };

    t.throws(function () {
        onfire.generateConstructor(cfg);
    }, 'Throws an error');

    t.end();
});


test('Fails with invalid config value', function (t) {

    t.throws(function () {
        onfire.generateConstructor('This is not a config');
    }, 'Throws an error');

    t.end();
});


test('Generates a simple model constructor', function (t) {

    var cfg = {
        number: 'number',
        string: 'string',
        boolean: 'boolean'
    };

    var Model = onfire.generateConstructor(cfg);

    t.ok(Model.prototype instanceof onfire.model.Model, 'Constructs subclass of onfire.model.Model');

    // Check for property getters/setters.
    for (var p in cfg) {
        t.equal(typeof Model.prototype[p], 'function', 'Has method ' + p + '()');
    }
    t.end();
});


test('Generates a simple collection constructor', function (t) {

    var cfg = {
        $id: 'boolean'
    };

    var Collection = onfire.generateConstructor(cfg);

    t.ok(Collection.prototype instanceof onfire.model.Collection,
        'Constructs subclass of onfire.model.Collection');
    t.end();
});


test('Generates nested constructors for submodels', function (t) {

    var cfg = {
        details: {
            name: 'string',
            age: 'number'
        },
        items: {
            $id: 'boolean'
        }
    };

    var Model = onfire.generateConstructor(cfg);

    for (var p in cfg) {
        t.equal(typeof Model.prototype[p], 'function', 'Has method ' + p + '()');

        // Check for constructors of the nested models.
        if (typeof cfg[p] === 'object') {
            t.ok(Model.prototype[p + 'Ctor_'], 'Has nested constructor ' + p + 'Ctor_');
        }
    }

    t.end();
});


test('Uses pre-generated constructors for submodels', function (t) {

    var itemsCfg = {
        $id: 'boolean'
    };
    var ItemsCollection = onfire.generateConstructor(itemsCfg);

    var cfg = {
        details: {
            name: 'string',
            age: 'number'
        },
        items: ItemsCollection
    };

    var Model = onfire.generateConstructor(cfg);

    for (var p in cfg) {
        t.equal(typeof Model.prototype[p], 'function', 'Has method ' + p + '()');

        // Check for constructors of the nested models.
        if (typeof cfg[p] === 'object') {
            t.ok(Model.prototype[p + 'Ctor_'], 'Has nested constructor ' + p + 'Ctor_');
        }
    }

    t.end();
});
