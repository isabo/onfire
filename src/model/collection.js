goog.provide('onfire.model.Collection');

goog.require('onfire.model.Model');
goog.require('onfire.model.Error');
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

    /**
     * Callback function for notifying consumer when a child has been added.
     *
     * @type {function(string)|null}
     * @protected
     */
    this.childAddedCallback;

    /**
     * Callback function for notifying consumer when a child has been removed.
     *
     * @type {function(string)|null}
     * @protected
     */
    this.childRemovedCallback;
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
 * Releases resources used by the collection. Call this when you no longer need the instance.
 *
 * @export
 */
onfire.model.Collection.prototype.dispose = function() {

    onfire.model.Collection.base(this, 'dispose');

    this.childAddedCallback = null;
    this.childRemovedCallback = null;
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
 * @throws {Error}
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

    if (!this.isLoaded) {
        throw new Error(onfire.model.Error.NOT_LOADED);
    }

    if (!this.memberCtor_) {
        throw new Error(onfire.model.Error.NOT_A_MODEL);
    }

    if (!this.containsKey(key)) {
        throw new Error(onfire.model.Error.NO_SUCH_KEY);
    }

    return new this.memberCtor_(this.ref.child(key));
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

    if (!this.isLoaded) {
        throw new Error(onfire.model.Error.NOT_LOADED);
    }

    if (!this.containsKey(key)) {
        throw new Error(onfire.model.Error.NO_SUCH_KEY);
    }

    return this.storageObj[key];
};


/**
 * Registers the desire to change the primitive value associated with a key. The value will be
 * committed only when .save() is called. Returns a reference to the current model to allow
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
 * @throws {Error}
 */
onfire.model.Collection.prototype.set = function(key, value) {

    // TODO: validate that value is a Firebase.Value.
    // TODO: validate that value matches the schema.

    if (!this.isLoaded) {
        throw new Error(onfire.model.Error.NOT_LOADED);
    }

    if (this.memberCtor_) {
        throw new Error(onfire.model.Error.NOT_A_PRIMITIVE);
    }

    this.changes[key] = value;
    this.hasOustandingChanges = true;

    return this;
};


/**
 * @override the return type.
 * @return {!Promise<!onfire.model.Collection,!Error>|!goog.Promise<!onfire.model.Collection,!Error>}
 */
onfire.model.Collection.prototype.save;


/**
 * @override the return type.
 * @param {!Object<string,Firebase.Value>} pairs An object containing the property/value pairs to
 *        update.
 * @return {!Promise<!onfire.model.Collection,!Error>|!goog.Promise<!onfire.model.Collection,!Error>}
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
 * @throws {Error}
 */
onfire.model.Collection.prototype.create = function(opt_values) {

    if (!this.isLoaded) {
        throw new Error(onfire.model.Error.NOT_LOADED);
    }

    if (!this.memberCtor_) {
        throw new Error(onfire.model.Error.NOT_A_MODEL);
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
 * Asynchronously retrieves an existing model by its key, or creates it if it does not yet exist,
 * and adds it to the collection.
 *
 * @param {string} key
 * @param {!Object<string,Firebase.Value>=} values A set of property/value pairs to assign if
 *      created. If null, don't set any values. The object will come into existence only when a
 *      value is set and committed to the database.
 * @return {!Promise<!onfire.model.Model,!Error>|!goog.Promise<!onfire.model.Model,!Error>} A
 *      promise that resolves to a model instance, or is rejected with an error.
 * @export
 * @throws {Error}
 */
onfire.model.Collection.prototype.fetchOrCreate = function(key, values) {

    if (!this.isLoaded) {
        throw new Error(onfire.model.Error.NOT_LOADED);
    }

    if (!this.memberCtor_) {
        throw new Error(onfire.model.Error.NOT_A_MODEL);
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
 * @throws {Error}
 */
onfire.model.Collection.prototype.remove = function(key) {

    if (!this.isLoaded) {
        throw new Error(onfire.model.Error.NOT_LOADED);
    }

    if (!this.containsKey(key)) {
        return onfire.utils.promise.resolve(null);
    }

    // self.set(key, null); <-- will throw an exception if collection members are models.
    this.changes[key] = null;
    this.hasOustandingChanges = true;
    return this.save().
        then(function(self) {
            return null;
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
 * @throws {Error}
 */
onfire.model.Collection.prototype.forEach = function(callback) {

    if (!this.isLoaded) {
        throw new Error(onfire.model.Error.NOT_LOADED);
    }

    var promises = [];
    for (var key in this.storageObj) {

        var p = this.memberCtor_ ?
            this.fetch(key) : onfire.utils.promise.resolve(this.getBasicValue(key));
        p = p.then((function(/* string */key, /** !onfire.model.Model|Firebase.Value */item) {
            return callback.call(null, item, key);
        }).bind(null, key));
        // ^ Bake the current key into the callback so it doesn't change by the time it is executed.
        promises.push(p);
    }

    return onfire.utils.promise.all(promises);
};


/**
 * Returns the number of values in the collection.
 *
 * @return {number} The number of values in the collection.
 * @export
 * @throws {Error}
 */
onfire.model.Collection.prototype.count = function() {

    if (!this.isLoaded) {
        throw new Error(onfire.model.Error.NOT_LOADED);
    }

    return this.childrenCount;
};


/**
 * Determines whether the collection already has an entry for the provided key.
 *
 * @param {string} key
 * @return {boolean}
 * @export
 * @throws {Error}
 */
onfire.model.Collection.prototype.containsKey = function(key) {

    if (!this.isLoaded) {
        throw new Error(onfire.model.Error.NOT_LOADED);
    }

    return !!this.storageObj && key in this.storageObj;
};


/**
 * Returns an array of the keys of members in the collection.
 *
 * @return {!Array<string>} An array of the keys of members in the collection.
 * @export
 * @throws {Error}
 */
onfire.model.Collection.prototype.keys = function() {

    if (!this.isLoaded) {
        throw new Error(onfire.model.Error.NOT_LOADED);
    }

    return goog.object.getKeys(this.storageObj);
};


/**
 * Register the callback function that will be called whenever a child is added. To deregister
 * an existing callback, just pass null as the callback argument.
 *
 * @param {function(string)|null} callback A function that will be called with the key of the new
 *      child.
 * @export
 */
onfire.model.Collection.prototype.onChildAdded = function(callback) {

    this.childAddedCallback = callback;
};


/**
 * Register the callback function that will be called whenever a child is removed. To deregister
 * an existing callback, just pass null as the callback argument.
 *
 * @param {function(string)|null} callback A function that will be called with the key of the
 *      removed child.
 * @export
 */
onfire.model.Collection.prototype.onChildRemoved = function(callback) {

    this.childRemovedCallback = callback;
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
        if (this.childAddedCallback) {
            this.childAddedCallback.call(null, snapshot.key());
        }
    }

};


/**
 * Remove a property/value pair.
 *
 * @param {!Firebase.DataSnapshot} snapshot
 * @private
 */
onfire.model.Collection.prototype.handleChildRemoved_ = function(snapshot) {

    var key = snapshot.key();
    if (this.containsKey(key)) {
        delete this.storageObj[key];
        this.childrenCount--;
        if (this.childrenCount === 0) {
            this.storageObj = null;
        }
        if (this.childRemovedCallback) {
            this.childRemovedCallback.call(null, snapshot.key());
        }
    }
};
