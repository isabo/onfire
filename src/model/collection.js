goog.provide('onfire.model.Collection');

goog.require('onfire.model.Model');
goog.require('onfire.triggers');
goog.require('onfire.utils.promise');
goog.require('goog.object');


/**
 * Base class for collections (object maps) that live in Firebase.
 *
 * @param {!onfire.Ref} ref The reference of the current object.
 * @param {!function(new:onfire.model.Model, !onfire.Ref, number=)=} opt_memberCtor The constructor
 *      to use for instances of collection members.
 * @constructor
 * @extends {onfire.model.Model}
 * @template T
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
 * @override the return type.
 * @return {!Promise<!onfire.model.Collection,!Error>|!goog.Promise<!onfire.model.Collection,!Error>}
 */
onfire.model.Collection.prototype.whenLoaded;


/**
 * Get the value corresponding to an ID. If the value is a model, it is better to call .fetch()
 * which returns a promise that resolves when the model is fully loaded and ready to use.
 *
 * @override
 * @param {string} key An key of an item in the collection.
 * @return {Firebase.Value|onfire.model.Model}
 * @export
 */
onfire.model.Collection.prototype.get = function(key) {

    return this.memberCtor_ ? this.getModel(key) : this.getBasicValue(key);
};


/**
 * Return a model instance to represent the item whose ID is provided. Note that the model will
 * only be ready to use once its .whenLoaded() promise has resolved. In most cases, it would be
 * easier to call .fetch() which is shorthand for the above.
 *
 * @param {string} key The key of the desired item.
 * @return {!onfire.model.Model}
 * @export
 */
onfire.model.Collection.prototype.getModel = function(key) {

    // TODO: validate that we have such an item.
    if (this.memberCtor_) {
        if (this.containsKey(key)) {
            return new this.memberCtor_(this.ref.child(key));
        } else {
            throw new Error('No such key in the collection.');
        }
    } else {
        throw new Error('Cannot create a model for a primitive value');
    }
};


// TODO: should we change the visibility of this to protected?
/**
 * @override the return type.
 * @param {string} propertyName The name of a property.
 * @param {Firebase.Value} value The primitive value to assign to the property.
 * @return {!onfire.model.Collection}
 */
onfire.model.Collection.prototype.set;


// TODO: should we change the visibility of this to protected?
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
 * Instantiate a specified item.
 *
 * @param {string} key The key of the member.
 * @return {!Promise<!T,!Error>|!goog.Promise<!T,!Error>}
 * @export
 */
onfire.model.Collection.prototype.fetch = function(key) {

    return this.getModel(key).whenLoaded();
};


/**
 * Instantiate a new, empty item, which, when written to, will become a member of the collection.
 *
 * @param {!Object<string,Firebase.Value>=} opt_values An object containing the property/value pairs
 *        to set.
 * @return {!Promise<!T,!Error>|!goog.Promise<!T,!Error>}
 * @export
 */
onfire.model.Collection.prototype.create = function(opt_values) {

    if (!this.memberCtor_) {
        throw new Error('.create() is for creating models, not primitive values');
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
 * Fetch an item by its key, or create it if it does not yet exist, and use the provided key.
 *
 * @param {string} key
 * @param {Object} values A set of property/value pairs to assign if created. If null, don't set
 *      any values. The object will come into existence only when a value is set.
 * @return {!Promise<!T,!Error>|!goog.Promise<!T,!Error>}
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
 * Remove the specified member of the collection. The promise is not rejected if the member is not
 * present.
 *
 * @param {string} key The key of the member.
 * @return {!Promise<null,!Error>|!goog.Promise<null,!Error>}
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
            removed.dispose();
        });
};


/**
 * Perform an operation on each member of the collection.
 *
 * @param {
        !function((!onfire.model.Model|Firebase.Value), string=):(!Promise|!goog.Promise|undefined)
    } callback
 * @return {(!Promise|!goog.Promise)}
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
 * Return the number of values.
 *
 * @return {number}
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
 * Return an array of the keys of items in the collection.
 *
 * @return {!Array<string>}
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

    this.storageObj[snapshot.key()] = snapshot.val();
    this.childrenCount++;
};


/**
 * Remove a property/value pair.
 *
 * @param {!Firebase.DataSnapshot} snapshot
 * @private
 */
onfire.model.Collection.prototype.handleChildRemoved_ = function(snapshot) {

    delete this.storageObj[snapshot.key()];

    if (goog.object.getKeys(this.storageObj).length === 0) {
        this.storageObj = null;
    }

    this.childrenCount--;
};
