goog.provide('onfire.model.Collection');

goog.require('onfire.model.Model');
goog.require('onfire.triggers');
goog.require('onfire.utils.firebase.EventType');
goog.require('onfire.utils.promise');
goog.require('goog.object');


/**
 * Base class for collections that live in Firebase. If collection members are not primitives, they
 * are lazily loaded -- only when requested.
 *
 * @param {!onfire.Ref} ref The reference of the current object.
 * @param {!function(new:onfire.model.Model, !onfire.Ref, number=)=} opt_memberCtor The model
 *      constructor to use for instances of collection members. If the members are primitives,
 *      this should not be supplied.
 * @constructor
 * @extends {onfire.model.Model}
 * @export
 */
onfire.model.Collection = function(ref, opt_memberCtor) {

    onfire.model.Collection.base(this, 'constructor', ref);

    /**
     * Any members should be instantiated with this constructor.
     *
     * @type {function(new:onfire.model.Model, !onfire.Ref, number=)|undefined}
     * @private
     */
    this.memberCtor_ = opt_memberCtor;
};
goog.inherits(onfire.model.Collection, onfire.model.Model);


/**
 * Loads the initial data and starts listening for changes.
 *
 * @override
 * @return {!Promise<!onfire.model.Model,!Error>|!goog.Promise<!onfire.model.Model,!Error>}
 * @protected
 */
onfire.model.Collection.prototype.startMonitoring = function() {

    var self = this;
    var p = this.ref.onceValue().
        then(function(/** Object */data) {
            self.handleValue(data);
            return self;
        });

    // When the above promise resolves, the collecion is fully loaded. It will then need to listen
    // for new and removed items.

    p.then(function() {
        var f1 = self.ref.on(onfire.utils.firebase.EventType.CHILD_ADDED, self.handleChildAdded_,
            undefined, self);
        var f2 = self.ref.on(onfire.utils.firebase.EventType.CHILD_REMOVED,
            self.handleChildRemoved_, undefined, self);

        self.monitoringParams.push([onfire.utils.firebase.EventType.CHILD_ADDED, f1, self]);
        self.monitoringParams.push([onfire.utils.firebase.EventType.CHILD_REMOVED, f2, self]);
    });

    return p;
};


/**
 * @override the return type.
 * @return {!Promise<!onfire.model.Collection,!Error>|!goog.Promise<!onfire.model.Collection,!Error>}
 */
onfire.model.Collection.prototype.whenLoaded;


/**
 * Synchronously retrieves the value associated with a key. If the collection members are not
 * primitive values, a model instance will be returned, in which case .whenLoaded() should be called
 * on the returned model in order to know when it is ready to use. Consider using the asynchronous
 * .fetch() method instead.
 * Throws an exception if the key does not have a value in the underlying data.
 *
 * @override
 * @param {string} key An key of an item in the collection.
 * @return {Firebase.Value|onfire.model.Model} A primitive value or a model instance.
 * @export
 */
onfire.model.Collection.prototype.get = function(key) {

    return this.memberCtor_ ? this.getModel(key) : this.getBasicValue(key);
};


/**
 * Synchronously retrieves the value associated with a key and wraps it in a model instance. Make
 * sure to call .whenLoaded() on the returned model in order to know when it is ready to use.
 * Consider using the asynchronous .fetch() method instead.
 * Throws an exception if the key does not have a value in the underlying data.
 *
 * @param {string} key The key of the desired item.
 * @return {!onfire.model.Model} A model instance.
 * @export
 * @throws {Error}
 */
onfire.model.Collection.prototype.getModel = function(key) {

    if (this.memberCtor_) {
        if (this.containsKey(key)) {
            return new this.memberCtor_(this.ref.child(key));
        } else {
            throw new Error('No such key in this collection: ' + key);
        }
    } else {
        throw new Error('Cannot create a model for a primitive value');
    }
};


/**
 * Synchronously retrieves the primitive value associated with a key. If the value is an object, it
 * is returned unwrapped, i.e. not as a model instance.
 * Throws an exception if the key does not have a value in the underlying data.
 *
 * @param {string} key The key of the desired value.
 * @return {Firebase.Value}
 * @export
 * @throws {Error}
 */
onfire.model.Collection.prototype.getBasicValue = function(key) {

    if (this.containsKey(key)) {
        return this.storageObj[key];
    } else {
        throw new Error('No such key in this collection: ' + key);
    }
};


/**
 * Registers the desire to change the primitive value associated with a key. The value will be
 * committed only when .save() is called. Returns a a reference to the current model to allow
 * chaining, e.g.,
 *      person.set('firstName', 'John').set('lastName', 'Smith').save()
 * Throws an error if the key is not specified in the schema and does not already have a value in
 * the underlying data.
 *
 * @override return type.
 * @param {string} key The name of a property.
 * @param {Firebase.Value} value The primitive value to assign to the property.
 * @return {!onfire.model.Collection}
 * @export
 */
onfire.model.Collection.prototype.set = function(key, value) {

    // TODO: validate that value is a Firebase.Value.
    // TODO: validate that value matches the schema.

    if (this.memberCtor_) {
        throw new Error('.set() is for primitive values, not models.' +
            ' Use .create() or .fetchOrCreate() instead.');
    }

    this.changes[key] = value;
    this.hasOustandingChanges = true;

    return this;
};


/**
 * @override the return type.
 * @return {!onfire.model.Collection}
 */
onfire.model.Collection.prototype.save;


/**
 * @override the return type.
 * @param {!Object<string,Firebase.Value>} pairs An object containing the property/value pairs to
 *        update.
 * @return {!onfire.model.Collection}
 * @protected
 */
onfire.model.Collection.prototype.update;


/**
 * Asynchronously retrieves a model instance that represents a member of the collection. Throws an
 * exception if the key does not exist.
 *
 * @param {string} key The key of the member.
 * @return {!Promise<!onfire.model.Model,!Error>|!goog.Promise<!onfire.model.Model,!Error>} A
 *      promise that resolves to a model instance, or is rejected with an error.
 * @export
 * @throws {Error}
 */
onfire.model.Collection.prototype.fetch = function(key) {

    return this.getModel(key).whenLoaded();
};


/**
 * Asynchronously creates a model instance and adds it as a member of the collection, with an
 * automatically generated key.
 *
 * @param {!Object<string,Firebase.Value>=} opt_values An object containing the property/value pairs
 *        to initialize the new object with.
 * @return {!Promise<!onfire.model.Model,!Error>|!goog.Promise<!onfire.model.Model,!Error>} A
 *      promise that resolves to a model instance, or is rejected with an error.
 * @export
 */
onfire.model.Collection.prototype.create = function(opt_values) {

    if (!this.memberCtor_) {
        throw new Error('.create() is for creating models, not primitive values.' +
            ' Use .set() instead.');
    }

    var key = this.ref.generateId();
    var model = new this.memberCtor_(this.ref.child(key));
    var p = model.whenLoaded();
    if (opt_values) {
        p = p.then(function(/** !onfire.model.Model */item) {
            return item.update(/** @type {!Object<string,Firebase.Value>} */(opt_values));
        });
    }

    return p;
};


/**
 * Asynchronously retrieves an existing item by its key, or creates it if it does not yet exist, and
 * adds it to the collection.
 *
 * @param {string} key
 * @param {!Object<string,Firebase.Value>=} values A set of property/value pairs to assign if
 *      created. If null, don't set any values. The object will come into existence only when a
 *      value is set and committed to the database.
 * @return {!Promise<!onfire.model.Model,!Error>|!goog.Promise<!onfire.model.Model,!Error>} A
 *      promise that resolves to a model instance, or is rejected with an error.
 * @export
 */
onfire.model.Collection.prototype.fetchOrCreate = function(key, values) {

    if (!this.memberCtor_) {
        throw new Error('.fetchOrCreate() is for fetching/creating models, not primitive values');
    }

    var item = new this.memberCtor_(this.ref.child(key));
    return item.whenLoaded().
        then(function(/** !onfire.model.Model */item) {

            if (values) {

                return item.initializeValues(values).
                    then(function() {
                        return item;
                    });

            } else {
                return item;
            }
        });
};


/**
 * Asynchronously removes the specified member of the collection. The promise is not rejected if the
 * member is not present.
 *
 * @param {string} key The key of the member.
 * @return {!Promise<null,!Error>|!goog.Promise<null,!Error>} A promise that resolves when the
 *      operation is complete, or is rejected with an error.
 * @export
 */
onfire.model.Collection.prototype.remove = function(key) {

    if (!this.containsKey(key)) {
        return onfire.utils.promise.resolve(null);
    }

    // We need an instance of the item being removed, so that we can provide it to the trigger
    // function. Nope -- by the time that happens, its properties will be null?!! Add a .disconnect()
    // method that will freeze the current snapshot?
    var promise = this.memberCtor_ ?
        this.fetch(key) : onfire.utils.promise.resolve(this.getBasicValue(key));

    var removed;
    var self = this;
    return promise.
        then(function(/** !onfire.model.Model|Firebase.Value */item) {
            removed = item;
        }).
        then(function() {
            self.set(key, null);
            return self.save();
        }).
        then(function() {
            return onfire.triggers.triggerChildRemoved(self.ref, removed, key);
        }).
        then(function() {
            if (removed instanceof onfire.model.Model) {
                removed.dispose();
            }
        });
};


/**
 * Calls a callback for each member of the collection. Returns a promise that is resolved once all
 * the callbacks have been invoked, and any promises returned by callbacks have themselves been
 * resolved.
 * The callback function should accept a primitive value or a model instance, according to the type
 * of members in the collection. It does not need to return anything, but if it returns a promise,
 * the main return value of this method (a promise) will depend on it.
 *
 * @param {
        !function((!onfire.model.Model|Firebase.Value), string=):(!Promise|!goog.Promise|undefined)
    } callback
 * @return {(!Promise|!goog.Promise)} A promise that in resolved when all callbacks have completed.
 * @export
 */
onfire.model.Collection.prototype.forEach = function(callback) {

    var promises = [];
    for (var key in this.storageObj) {

        var p = this.memberCtor_ ?
            this.fetch(key) : onfire.utils.promise.resolve(this.getBasicValue(key));
        p.then(function(/** !onfire.model.Model|Firebase.Value */item) {
                return callback.call(null, item, key);
            });
        promises.push(p);
    }

    return onfire.utils.promise.all(promises);
};


/**
 * Returns the number of values in the collection.
 *
 * @return {number} The number of values in the collection.
 * @export
 */
onfire.model.Collection.prototype.count = function() {

    return this.childrenCount;
};


/**
 * Determines whether the collection already has an entry for the provided key.
 *
 * @param {string} key
 * @return {boolean}
 * @export
 */
onfire.model.Collection.prototype.containsKey = function(key) {

    return key in this.storageObj;
};


/**
 * Returns an array of the keys of members in the collection.
 *
 * @return {!Array<string>} An array of the keys of members in the collection.
 * @export
 */
onfire.model.Collection.prototype.keys = function() {

    return goog.object.getKeys(this.storageObj);
};


/**
 * Add a property/value pair.
 *
 * @param {!Firebase.DataSnapshot} snapshot
 * @private
 */
onfire.model.Collection.prototype.handleChildAdded_ = function(snapshot) {

    if (!this.storageObj) {
        this.storageObj = {};
    }

    var key = snapshot.key();
    var incrementNeeded = !this.containsKey(key);
    this.storageObj[key] = snapshot.val();
    if (incrementNeeded) {
        this.childrenCount++;
    }
};


/**
 * Remove a property/value pair.
 *
 * @param {!Firebase.DataSnapshot} snapshot
 * @private
 */
onfire.model.Collection.prototype.handleChildRemoved_ = function(snapshot) {

    delete this.storageObj[snapshot.key()];
    this.childrenCount--;
    if (this.childrenCount === 0) {
        this.storageObj = null;
    }
};
