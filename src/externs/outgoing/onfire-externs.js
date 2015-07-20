/**
 * An analogue of a Firebase reference.
 * @see https://www.firebase.com/docs/web/api/firebase/constructor.html
 *
 * @param {!Firebase} ref
 * @constructor
 * @final
 */
onfire.Ref = function(ref) {};


/**
 * Returns a reference that is relative to the current location.
 * @see https://www.firebase.com/docs/web/api/firebase/child.html
 *
 * @param {string} childPath
 * @return {!onfire.Ref} A reference that is relative to the current location.
 * @nosideeffects
 */
onfire.Ref.prototype.child = function(childPath) {};


/**
 * Generates a push ID. This takes the place of .push() when all we want is a unique ID, via a
 * synchronous method instead of a promise, which is what .push() returns.
 *
 * @return {string} A unique ID.
 */
onfire.Ref.prototype.generateId = function() {};


/**
 * Returns the key of the current location.
 * @see https://www.firebase.com/docs/web/api/firebase/key.html
 *
 * @return {string} The key of the current location.
 * @nosideeffects
 */
onfire.Ref.prototype.key = function() {};


/**
 * Deregisters a previously registered callback.
 * @see https://www.firebase.com/docs/web/api/query/off.html
 *
 * @param {string=} opt_eventType
 * @param {!Firebase.EventCallback=} opt_callback If provided, this MUST be the *wrapped* callback
 *      returned by the .on() method.
 * @param {!Object=} opt_context
 */
onfire.Ref.prototype.off = function(opt_eventType, opt_callback, opt_context) {};


/**
 * Deregisters a previously registered .onValue() callback.
 *
 * @param {!function(Firebase.Value)} callback This MUST be the *wrapped* callback returned
 *      by .onValue().
 * @param {!Object=} context
 */
onfire.Ref.prototype.offValue = function(callback, context) {};


/**
 * Registers a callback for an event of a specified type at the current location. Make sure to keep
 * the return value for use when turning this off -- see the off() method.
 * @see https://www.firebase.com/docs/web/api/query/on.html
 *
 * @param {string} eventType
 * @param {!Firebase.EventCallback} callback
 * @param {function(!Error)=} cancelCallback
 * @param {Object=} context
 * @return {!function(!Firebase.DataSnapshot, ?string=)} A handler function that may be needed when
 *      deregistering the callback.
 */
onfire.Ref.prototype.on = function(eventType, callback, cancelCallback, context) {};


/**
 * Waits for the first event of a specified type at the current location. A promisified analogue
 * of Firebase's .once() method.
 * @see https://www.firebase.com/docs/web/api/query/once.html
 *
 * @param {string} eventType
 * @return {!Promise<!Firebase.DataSnapshot,!Error>|!goog.Promise<!Firebase.DataSnapshot,!Error>} A
 *      promise that resolves to a Firebase snapshot, or is rejected with an error.
 */
onfire.Ref.prototype.once = function(eventType) {};


/**
 * Retrieves the value that is stored at the current location. This is shorthand for calling .once()
 * for the 'value' event and then extracting the value of the returned snapshot.
 *
 * @return {!Promise<Firebase.Value,!Error>|!goog.Promise<Firebase.Value,!Error>} A promise that
 *      resolves to the value stored at the current location, or is rejected with an error.
 */
onfire.Ref.prototype.onceValue = function() {};


/**
 * Registers a callback for value changes at the current location. This is shorthand for calling
 * .on() for the 'value' event and then extracting the value of each returned snapshot. Make sure to
 * keep the return value for when you want to turn this off. See the .offValue() method.
 *
 * @param {!function(Firebase.Value)} callback
 * @param {!function(!Error)=} cancelCallback
 * @param {!Object=} context
 * @return {!function(!Firebase.DataSnapshot)}
 */
onfire.Ref.prototype.onValue = function(callback, cancelCallback, context) {};


/**
 * Returns a reference to the parent of the current location.
 * @see https://www.firebase.com/docs/web/api/firebase/parent.html
 *
 * @return {onfire.Ref} A reference to the parent of the current location.
 * @nosideeffects
 */
onfire.Ref.prototype.parent = function() {};


/**
 * Returns the path of this reference relative to the root, i.e. not including the firebaseio.com
 * domain.
 *
 * @return {string} The path of this reference relative to the root.
 * @nosideeffects
 */
onfire.Ref.prototype.path = function() {};


/**
 * Pushes a value under the current location. A promisified analogue of Firebase's .push() method.
 * @see https://www.firebase.com/docs/web/api/firebase/push.html
 *
 * @param {Firebase.Value=} opt_value
 * @return {!Promise<!onfire.Ref,!Error>|!goog.Promise<!onfire.Ref,!Error>} A promise that resolves
 *      to the Ref of the newly pushed child.
 */
onfire.Ref.prototype.push = function(opt_value) {};


/**
 * Returns an unwrapped Firebase reference to the current location.
 *
 * @return {!Firebase} An unwrapped Firebase reference to the current location.
 * @nosideeffects
 */
onfire.Ref.prototype.ref = function() {};


/**
 * Removes the data that is stored at the current location. A promisified analogue of Firebase's
 * .remove() method.
 * @see https://www.firebase.com/docs/web/api/firebase/remove.html
 *
 * @return {!Promise<null,!Error>|!goog.Promise<null,!Error>} A promise that resolves when the
 *      operation is complete, or is rejected with an error.
 */
onfire.Ref.prototype.remove = function() {};


/**
 * Returns a reference that represents the root of the tree.
 * @see https://www.firebase.com/docs/web/api/firebase/root.html
 *
 * @return {!onfire.Ref} A reference that represents the root of the tree.
 * @nosideeffects
 */
onfire.Ref.prototype.root = function() {};


/**
 * Stores a value at the current location. A promisified analogue of Firebase's .set() method.
 * @see https://www.firebase.com/docs/web/api/firebase/set.html
 *
 * @param {Firebase.Value} value
 * @return {!Promise<null,!Error>|!goog.Promise<null,!Error>} A promise that resolves when the
 *      operation is complete, or is rejected with an error.
 */
onfire.Ref.prototype.set = function(value) {};


/**
 * Sets a the values stored at the current location, atomically. A promisified analogue of
 * Firebase's .transaction() method.
 * @see https://www.firebase.com/docs/web/api/firebase/transaction.html
 *
 * @param {Firebase.TransactionUpdateFunction} updateFn
 * @return
    {
        !Promise<!{{isCommitted:boolean,snapshot:Firebase.DataSnapshot}},!Error>
        |
        !goog.Promise<!{{isCommitted:boolean,snapshot:Firebase.DataSnapshot}},!Error>
    } A promise that resolves when the operation is complete, or is rejected with an error. The
    value provided when the promise resolves is an object with two properties:
        isCommitted: whether the operation actually committed a value to the database.
        snapshot: a snapshot of the current data.
 */
onfire.Ref.prototype.transaction = function(updateFn) {};


/**
 * Updates multiple key/value pairs stored at the current location. A promisified analogue of
 * Firebase's .update() method.
 * @see https://www.firebase.com/docs/web/api/firebase/update.html
 *
 * @param {!Object<string,Firebase.Value>} values An object containing the key/value pairs.
 * @return {!Promise<null,!Error>|goog.Promise<null,!Error>} A promise that resolves when the
 *      operation is complete, or is rejected with an error.
 */
onfire.Ref.prototype.update = function(values) {};




/**
 * Generates a subclass of onfire.model.Model or onfire.model.Collection with a baked in schema.
 *
 * @param {!Object} schema A schema object.
 * @return {!function(new:onfire.model.Model, !onfire.Ref)} A model constructor.
 * @throws {Error}
 */
onfire.defineModel = function(schema) {};




/**
 * Base class to represent objects that live in Firebase.
 *
 * @param {!onfire.Ref} ref The reference of the current object.
 * @constructor
 */
onfire.model.Model = function(ref) {};


/**
 * Releases resources used by the model. Call this when you no longer need the instance.
 */
onfire.model.Model.prototype.dispose = function() {};


/**
 * Determines whether the underlying data exists. We may have retrieved a non-existent object, or
 * it may have subsequently been deleted.
 *
 * @return {boolean} Whether the underlying data actually exists.
 */
onfire.model.Model.prototype.exists = function() {};


/**
 * Synchronously retrieves the value associated with a key. If the value is not a primitive, a model
 * instance will be returned, in which case .whenLoaded() should be called on the returned model in
 * order to know when it is ready to use. If the key is already known to represent a model, it is
 * better to obtain it via the asynchronous .fetch() method.
 * If the key is specified in the schema, its value, or a model representing its value,  will be
 * returned. If the key represents a primitive but missing value, the return value will be null.
 * If the key is not specified in the schema, but does have a value in the underlying data, that
 * value will be returned. Otherwise, an exception will be thrown.
 *
 * @param {string} key
 * @return {Firebase.Value|onfire.model.Model} A primitive value or a model instance.
 * @throws {Error}
 */
onfire.model.Model.prototype.get = function(key) {};


/**
 * Synchronously retrieves the primitive value associated with a key. If the value is an object, it
 * is returned unwrapped, i.e. not as a model instance.
 * If the key is specified in the schema, its value will be returned. If the key does not have a
 * value the return value will be null.
 * If the key is not specified in the schema, but does have a value in the underlying data, that
 * value will be returned. Otherwise, an exception will be thrown.
 *
 * @param {string} key The key under which the value is stored.
 * @return {Firebase.Value} The value or unwrapped object associated with the key.
 * @throws {Error}
 */
onfire.model.Model.prototype.getBasicValue = function(key) {};


/**
 * Synchronously retrieves the model instance that represents a non-primitive value that is
 * associated with a key. Make sure to call .whenLoaded() on the returned model in order to know when
 * it is ready to use. In many cases it may be more convenient to call the asynchronous .fetch()
 * method instead.
 * If the key is not specified in the schema, an exception will be thrown.
 *
 * @param {string} key
 * @return {!onfire.model.Model}
 * @throws {Error}
 */
onfire.model.Model.prototype.getModel = function(key) {};


/**
 * Determines whether there are any usaved changes on this model.
 *
 * @return {boolean} Whether there are any usaved changes on this model.
 */
onfire.model.Model.prototype.hasChanges = function() {};


/**
 * Returns the key of the model's reference.
 *
 * @return {string} The key of the model's reference
 */
onfire.model.Model.prototype.key = function() {};


/**
 * Asynchronously commits the outstanding changes.
 *
 * @return {!Promise<!onfire.model.Model,!Error>|!goog.Promise<!onfire.model.Model,!Error>} A
 *      promise that resolves to this model instance when the operation completes successfully, or
 *      is rejected with an error.
 */
onfire.model.Model.prototype.save = function() {};


/**
 * Registers the desire to change the primitive value associated with a key. The value will be
 * committed only when .save() is called. Returns a a reference to the current model to allow
 * chaining, e.g.,
 *      person.set('firstName', 'John').set('lastName', 'Smith').save()
 * Throws an error if the key is not specified in the schema and does not already have a value in
 * the underlying data.
 *
 * @param {string} key The name of a property.
 * @param {Firebase.Value} value The primitive value to assign to the property.
 * @return {!onfire.model.Model} This model instance, in order to make the method chainable.
 * @export
 * @throws {Error}
 */
onfire.model.Model.prototype.set = function(key, value) {};


/**
 * Returns a promise that is resolved to this instance when the data has been loaded.
 *
 * @return {!Promise<!onfire.model.Model,!Error>|!goog.Promise<!onfire.model.Model,!Error>} A
 *      promise resolves to this instance when the data has been loaded.
 */
onfire.model.Model.prototype.whenLoaded = function() {};




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
 */
onfire.model.Collection = function(ref, opt_memberCtor) {};


/**
 * Determines whether the collection already has an entry for the provided key.
 *
 * @param {string} key
 * @return {boolean}
 * @nosideeffects
 */
onfire.model.Collection.prototype.containsKey = function(key) {};


/**
 * Returns the number of values in the collection.
 *
 * @return {number} The number of values in the collection.
 * @nosideeffects
 */
onfire.model.Collection.prototype.count = function() {};


/**
 * Asynchronously creates a model instance and adds it as a member of the collection, with an
 * automatically generated key.
 *
 * @param {!Object<string,Firebase.Value>=} opt_values An object containing the property/value pairs
 *        to initialize the new object with.
 * @return {!Promise<!onfire.model.Model,!Error>|!goog.Promise<!onfire.model.Model,!Error>} A
 *      promise that resolves to a model instance, or is rejected with an error.
 */
onfire.model.Collection.prototype.create = function(opt_values) {};


/**
 * Asynchronously retrieves a model instance that represents a member of the collection. Throws an
 * exception if the key does not exist.
 *
 * @param {string} key The key of the member.
 * @return {!Promise<!onfire.model.Model,!Error>|!goog.Promise<!onfire.model.Model,!Error>} A
 *      promise that resolves to a model instance, or is rejected with an error.
 * @throws {Error}
 */
onfire.model.Collection.prototype.fetch = function(key) {};


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
 */
onfire.model.Collection.prototype.fetchOrCreate = function(key, values) {};


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
 */
onfire.model.Collection.prototype.forEach = function(callback) {};


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
 * @throws {Error}
 */
onfire.model.Collection.prototype.get = function(key) {};


/**
 * Synchronously retrieves the primitive value associated with a key. If the value is an object, it
 * is returned unwrapped, i.e. not as a model instance.
 * Throws an exception if the key does not have a value in the underlying data.
 *
 * @param {string} key The key of the desired value.
 * @return {Firebase.Value}
 * @throws {Error}
 */
onfire.model.Collection.prototype.getBasicValue = function(key) {};


/**
 * Synchronously retrieves the value associated with a key and wraps it in a model instance. Make
 * sure to call .whenLoaded() on the returned model in order to know when it is ready to use.
 * Consider using the asynchronous .fetch() method instead.
 * Throws an exception if the key does not have a value in the underlying data.
 *
 * @param {string} key The key of the desired item.
 * @return {!onfire.model.Model} A model instance.
 * @throws {Error}
 */
onfire.model.Collection.prototype.getModel = function(key) {};


/**
 * Returns an array of the keys of members in the collection.
 *
 * @return {!Array<string>} An array of the keys of members in the collection.
 * @nosideeffects
 */
onfire.model.Collection.prototype.keys = function() {};


/**
 * Asynchronously removes the specified member of the collection. The promise is not rejected if the
 * member is not present.
 *
 * @param {string} key The key of the member.
 * @return {!Promise<null,!Error>|!goog.Promise<null,!Error>} A promise that resolves when the
 *      operation is complete, or is rejected with an error.
 */
onfire.model.Collection.prototype.remove = function(key) {};


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
 */
onfire.model.Collection.prototype.set = function(key, value) {};


/**
 * @override the return type.
 * @return {!onfire.model.Collection}
 */
onfire.model.Collection.prototype.save;


/**
 * @override the return type.
 * @return {!Promise<!onfire.model.Collection,!Error>|!goog.Promise<!onfire.model.Collection,!Error>}
 */
onfire.model.Collection.prototype.whenLoaded;
