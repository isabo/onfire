goog.provide('onfire.model.Model');

goog.require('onfire.Ref');
goog.require('onfire.model.Error');
goog.require('onfire.model.schema');
goog.require('onfire.utils.firebase.EventType');
goog.require('onfire.utils.promise');
goog.require('onfire.utils.logging');
goog.require('goog.object');


/**
 * Base class to represent objects that live in Firebase.
 *
 * @param {!onfire.Ref} ref The reference of the current object.
 * @constructor
 * @export
 */
onfire.model.Model = function(ref) {

    if (!(ref instanceof onfire.Ref)) {
        throw new Error(onfire.model.Error.INVALID_REF);
    }

    /**
     * @type {!onfire.Ref}
     * @protected
     */
    this.ref = ref;

    /**
     * Whether the model has fully loaded and got its data from the database yet.
     *
     * @type {boolean}
     * @protected
     */
    this.isLoaded;

    /**
     * Callback function for notifying consumer when a change has occurred.
     *
     * @type {function()|null}
     * @protected
     */
    this.valueCallback;

    /**
     * The current state in the database.
     *
     * @type {Object}
     * @protected
     */
    this.storageObj;

    /**
     * Outstanding changes that haven't yet been saved.
     *
     * @type {!Object}
     * @protected
     */
    this.changes = {};

    /**
     * Whether there are changes that have not yet been saved.
     *
     * @type {boolean}
     * @protected
     */
    this.hasOustandingChanges = false;

    /**
     * The number of properties in this model. Useful for collections where the property name is
     * an ID.
     *
     * @type {number}
     * @protected
     */
    this.childrenCount = 0;

    /**
     * The schema object used to generate this instance.
     *
     * @type {Object}
     * @protected
     */
    this.schema = null;

    /**
     * Instances of subordinate models to dispose.
     *
     * @type {!Array<!onfire.model.Model>}
     * @private
     */
    this.toDispose_ = [];

    /**
     * Monitoring details that need to be unmonitored during disposal.
     *
     * @type {!Array<!Array>} An array where each entry is an array [event name, function, context].
     * @protected
     */
    this.monitoringParams = [];

    /**
     * A promise that resolves when the model data has finished loading.
     *
     * @type {!Promise<!onfire.model.Model,!Error>|!goog.Promise<!onfire.model.Model,!Error>}
     * @private
     */
    this.loadPromise_ = this.startMonitoring();
};


/**
 * Releases resources used by the model. Call this when you no longer need the instance.
 *
 * @export
 */
onfire.model.Model.prototype.dispose = function() {

    onfire.utils.logging.info('DISPOSE  ' + this.ref.path() + ' ...');

    delete this.loadPromise_;// = null;
    this.stopMonitoring_();
    this.valueCallback = null;

    // Dispose subordinate models that were created by constructor.
    for (var i = 0; i < this.toDispose_.length; i++) {
        this.toDispose_[i].dispose();
    }

    onfire.utils.logging.info('DISPOSED ' + this.ref.path());
};


/**
 * Adds properties and subordinate model instances to the current instance, based on its schema
 * object. This is called by generated subclasses of onfire.model.Model.
 *
 * @param {!Object} schema
 * @package
 */
onfire.model.Model.prototype.configureInstance = function(schema) {

    this.schema = schema;

    var promises = [];

    for (var key in this.schema) {

        var rhs = this.schema[key];
        var ctor;
        var valueType = onfire.model.schema.determineValueType(rhs);

        switch (valueType) {

            case onfire.model.schema.ValueType.STRING:
            case onfire.model.schema.ValueType.NUMBER:
            case onfire.model.schema.ValueType.BOOLEAN:

                // A primitive type name.
                // A getter/setter has already been configured on the prototype.
                break;

            case onfire.model.schema.ValueType.CONSTRUCTOR:
            case onfire.model.schema.ValueType.MODEL:
            case onfire.model.schema.ValueType.COLLECTION:

                // The value is the schema for a subordinate model.
                // Create the appropriate model or collection instance from the constructor that
                // was generated during the definition phase.
                ctor = this[key + onfire.model.Model.CONSTRUCTOR_SUFFIX];
                this[key + onfire.model.Model.INSTANCE_SUFFIX] = new ctor(this.ref.child(key));
                promises.push(this[key + onfire.model.Model.INSTANCE_SUFFIX].whenLoaded());

                // Remember to dispose of it when no longer needed.
                this.toDispose_.push(this[key + onfire.model.Model.INSTANCE_SUFFIX]);
                break;

            default:
                throw new TypeError('Invalid property type for ' + key);
        }
    }

    // Model is now ready only when subordinate models are ready.
    var self = this;
    this.loadPromise_ = this.loadPromise_.
        then(function() {
            return onfire.utils.promise.all(promises);
        }).
        then(function() {
            self.isLoaded = true;
            return self;
        });

    // Since we just extended the loadPromise, we are not considered loaded.
    self.isLoaded = false;
};


/**
 * Load the initial data and watch for changes.
 *
 * @return {!Promise<!onfire.model.Model,!Error>|!goog.Promise<!onfire.model.Model,!Error>}
 * @protected
 */
onfire.model.Model.prototype.startMonitoring = function() {

    var self = this;
    return onfire.utils.promise.newPromise(function(resolve, reject) {

        self.isLoaded = false;

        // Monitor VALUE events.
        var fn = self.ref.onValue(function(/** !Object */newValue) {

            var wasAlreadyLoaded = self.isLoaded;

            self.handleValue(newValue);

            // Resolve/reject promise upon first response.
            if (!wasAlreadyLoaded) {
                resolve(self);
            }

        }, function(/** !Error */err) {

            // Monitoring is cancelled.
            if (!self.isLoaded) {
                reject(err);
            }
        });

        // Store the monitoring function to be used during disposal.
        self.monitoringParams.push([onfire.utils.firebase.EventType.VALUE, fn]);
    });
};


/**
 * Stop monitoring Firebase events.
 *
 * @private
 */
onfire.model.Model.prototype.stopMonitoring_ = function() {

    // Remove listeners.
    for (var i = 0; i < this.monitoringParams.length; i++) {
        this.ref.off.apply(this.ref, this.monitoringParams[i]);
    }
};


/**
 * Returns a promise that is resolved to this instance when the data has been loaded.
 *
 * @return {!Promise<!onfire.model.Model,!Error>|!goog.Promise<!onfire.model.Model,!Error>} A
 *      promise resolves to this instance when the data has been loaded.
 * @export
 */
onfire.model.Model.prototype.whenLoaded = function() {

    return this.loadPromise_;
};


/**
 * Returns the key of the model's reference.
 *
 * @return {string} The key of the model's reference
 * @export
 */
onfire.model.Model.prototype.key = function() {

    return this.ref.key();
};


/**
 * Determines whether the underlying data exists. We may have retrieved a non-existent object, or
 * it may have subsequently been deleted.
 *
 * @return {boolean} Whether the underlying data actually exists.
 * @export
 * @throws {Error} if called when model is not yet loaded.
 */
onfire.model.Model.prototype.exists = function() {

    if (!this.isLoaded) {
        throw new Error(onfire.model.Error.NOT_LOADED);
    }

    return !!this.storageObj;
};


/**
 * Register the callback function that will be called whenever the model is updated. To deregister
 * an existing callback, just pass null as the callback argument.
 *
 * @param {function()|null} callback
 * @export
 */
onfire.model.Model.prototype.onValueChanged = function(callback) {

    this.valueCallback = callback;
};


/**
 * Handle an updated object.
 *
 * @param {Object} newValue
 * @protected
 */
onfire.model.Model.prototype.handleValue = function(newValue) {

    this.storageObj = newValue;
    this.childrenCount = goog.object.getKeys(newValue).length;

    this.isLoaded = true; // Now the callback can call methods without triggering exceptions.

    // TODO: re-evaluate whether we have any outstanding changes. This value may have come from
    // somewhere else, and may render unnecessary some of our uncommitted changes.

    if (this.valueCallback) {
        this.valueCallback.call(null);
    }
};


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
 * @export
 * @throws {Error}
 */
onfire.model.Model.prototype.get = function(key) {

    if (this.isKeySpecified_(key) && typeof this.schema[key] !== 'string') {
        // The key represents a model, not a primitive.
        return this.getModel(key);
    } else {
        return this.getBasicValue(key);
    }
};


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
 * @export
 * @throws {Error}
 */
onfire.model.Model.prototype.getBasicValue = function(key) {

    if (!this.isLoaded) {
        throw new Error(onfire.model.Error.NOT_LOADED);
    }

    if (this.storageObj && key in this.storageObj) {
        return this.storageObj[key];
    }

    if (this.isKeySpecified_(key)) {
        // Key is allowed, but has not been assigned a value.
        return null;
    } else {
        throw new Error(onfire.model.Error.NO_SUCH_KEY);
    }
};


/**
 * Synchronously retrieves the model instance that represents a non-primitive value that is
 * associated with a key. Make sure to call .whenLoaded() on the returned model in order to know
 * when it is ready to use. In many cases it may be more convenient to call the asynchronous
 * .fetch() method instead.
 * If the key is not specified in the schema, an exception will be thrown.
 *
 * @param {string} key
 * @return {!onfire.model.Model}
 * @export
 * @throws {Error}
 */
onfire.model.Model.prototype.getModel = function(key) {

    if (!this.isLoaded) {
        throw new Error(onfire.model.Error.NOT_LOADED);
    }

    if (!this.isKeySpecified_(key)) {
        throw new Error(onfire.model.Error.NO_SUCH_KEY);
    }

    if (typeof this.schema[key] === 'string') {
        // The schema value for this key is a string like 'number', 'string', 'boolean' -- i.e.,
        // not an object or predefined model constructor.
        throw new Error(onfire.model.Error.NOT_A_MODEL);
    }

    //Value is an object according to the schema, and would already have been instantiated.
    return this[key + onfire.model.Model.INSTANCE_SUFFIX];
};


/**
 * Registers the desire to change the primitive value associated with a key. The value will be
 * committed only when .save() is called. Returns a reference to the current model to allow
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
onfire.model.Model.prototype.set = function(key, value) {

    // TODO: validate that value is a Firebase.Value.
    // TODO: validate that value matches the schema.
    if (!this.isLoaded) {
        throw new Error(onfire.model.Error.NOT_LOADED);
    }

    var keyIsSpecified = this.isKeySpecified_(key);
    var keyIsUsed = this.storageObj && key in this.storageObj;

    if (!keyIsSpecified && !keyIsUsed) {
        throw new Error(onfire.model.Error.NO_SUCH_KEY);
    }

    if (keyIsSpecified && typeof this.schema[key] !== 'string') {
        throw new Error(onfire.model.Error.NOT_A_PRIMITIVE);
    }

    this.changes[key] = value;
    this.hasOustandingChanges = true;

    return this;
};


/**
 * Determines whether a key is specified in the schema.
 *
 * @param {string} key
 * @return {boolean}
 * @private
 */
onfire.model.Model.prototype.isKeySpecified_ = function(key) {

    return key in this.schema;
};


/**
 * Determines whether there are any unsaved changes on this model.
 *
 * @return {boolean} Whether there are any unsaved changes on this model.
 * @export
 */
onfire.model.Model.prototype.hasChanges = function() {

    return this.hasOustandingChanges;
};


/**
 * Asynchronously commits the outstanding changes.
 *
 * @return {!Promise<!onfire.model.Model,!Error>|!goog.Promise<!onfire.model.Model,!Error>} A
 *      promise that resolves to this model instance when the operation completes successfully, or
 *      is rejected with an error.
 * @export
 * @throws {Error} if called when model is not yet loaded.
 */
onfire.model.Model.prototype.save = function() {

    if (this.hasOustandingChanges) {
        return this.update(this.changes).
            then(function(/** !onfire.model.Model */self) {
                // Reset the changes.
                self.changes = {};
                self.hasOustandingChanges = false;
                return self;
            });
    } else {
        return onfire.utils.promise.resolve(this);
    }
};


/**
 * Asynchronously and atomically changes the primitive values of a set of keys.
 *
 * @param {!Object<string,Firebase.Value>} pairs An object containing the key/value pairs to update.
 * @return {!Promise<!onfire.model.Model,!Error>|!goog.Promise<!onfire.model.Model,!Error>} A
 *      promise that resolves to this model instance when the operation completes successfully, or
 *      is rejected with an error.
 * @protected
 */
onfire.model.Model.prototype.update = function(pairs) {

    // TODO: validate.

    var oldCount = this.childrenCount;
    var self = this;
    return this.ref.update(pairs).
        then(function() {
            if (oldCount > 0 && self.childrenCount === 0) {
                // This object just disappeared because we set its remaining properties to null.
                onfire.utils.logging.info('REMOVED ' + self.ref.path());
            } else if (oldCount === 0 && self.childrenCount > 0) {
                // This object just came back into existence.
                onfire.utils.logging.info('CREATED ' + self.ref.path());
            }
            return self;
        });
};


/**
 * Sets values if the current object does not exist in the underlying database. Uses a transaction.
 *
 * @param {!Object} values A set of property/value pairs.
 * @return
    {
        !Promise<!{{isCommitted:boolean,snapshot:Firebase.DataSnapshot}},!Error>
        |
        !goog.Promise<!{{isCommitted:boolean,snapshot:Firebase.DataSnapshot}},!Error>
    }
 */
onfire.model.Model.prototype.initializeValues = function(values) {

    var self = this;
    return this.ref.transaction(function(data) {
        if (data === null) {
            return values;
        }
    }).
    then(function(/** !Object */result) {
        if (result['isCommitted']) {
            onfire.utils.logging.info('CREATED ' + self.ref.path());
        }
        return result;
    });
};


/**
 * The suffix that is appended to constructors that were generated in order to represent property
 * values that are models.
 *
 * @const {string}
 * @package
 */
onfire.model.Model.CONSTRUCTOR_SUFFIX = 'Ctor_';


/**
 * The suffix that is appended to property names of model instances that represent non-primitive
 * properties.
 *
 * @const {string}
 * @package
 */
onfire.model.Model.INSTANCE_SUFFIX = 'Inst_';
