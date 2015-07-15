goog.provide('onfire.model.Model');

goog.require('onfire.model.config');
goog.require('onfire.utils.promise');
goog.require('onfire.utils.logging');
goog.require('onfire.triggers');
goog.require('goog.object');


/**
 * Base class to represent objects that live in Firebase.
 *
 * @param {!onfire.Ref} ref The reference of the current object.
 * @constructor
 * @export
 */
onfire.model.Model = function(ref) {

    /**
     * @type {!onfire.Ref}
     * @protected
     */
    this.ref = ref;

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
     * @private
     */
    this.hasChanges_ = false;

    /**
     * The number of properties in this model. Useful for collections where the property name is
     * an ID.
     *
     * @type {number}
     * @protected
     */
    this.childrenCount = 0;

    /**
     * The configuration object used to generate this instance.
     *
     * @type {Object}
     * @protected
     */
    this.config = null;

    /**
     * Instances of subordinate models to dispose.
     *
     * @type {!Array<!onfire.model.Model>}
     * @private
     */
    this.toDispose_ = [];

    /**
     * A promise that resolves when the model data has finished loading.
     *
     * @type {!Promise<!onfire.model.Model,!Error>|!goog.Promise<!onfire.model.Model,!Error>}
     * @private
     */
    this.loadPromise_ = this.startMonitoring();
};


/**
 * Clean up.
 *
 * @export
 */
onfire.model.Model.prototype.dispose = function() {

    onfire.utils.logging.info('DISPOSE  ' + this.ref.path() + ' ...');
    var id = this.key();

    delete this.loadPromise_;// = null;
    this.stopMonitoring_();

    // Dispose subordinate models that were created by constructor.
    for (var i = 0; i < this.toDispose_.length; i++) {
        this.toDispose_[i].dispose();
    }

    onfire.utils.logging.info('DISPOSED ' + this.ref.path());
};


/**
 * Adds properties and subordinate model instances to the current instance, based on its
 * configuration object. This is called by generated subclasses of onfire.model.Model.
 *
 * @param {!Object} config
 * @package
 */
onfire.model.Model.prototype.configureInstance = function(config) {

    this.config = config;

    var promises = [];

    for (var name in this.config) {

        var rhs = this.config[name];
        var ctor;
        var valueType = onfire.model.config.determineValueType(rhs);

        switch (valueType) {

            case onfire.model.config.ValueType.STRING:
            case onfire.model.config.ValueType.NUMBER:
            case onfire.model.config.ValueType.BOOLEAN:

                // A primitive type name.
                // A getter/setter has already been configured on the prototype.
                break;

            case onfire.model.config.ValueType.MODEL:
            case onfire.model.config.ValueType.COLLECTION:

                // The value is the config for a subordinate model.
                // Create the appropriate model or collection instance from the constructor that
                // was generated during the definition phase.
                ctor = this[name + onfire.model.Model.CONSTRUCTOR_SUFFIX];
                this[name + onfire.model.Model.INSTANCE_SUFFIX] = new ctor(this.ref.child(name));
                promises.push(this[name + onfire.model.Model.INSTANCE_SUFFIX].whenLoaded());

                // Remember to dispose of it when no longer needed.
                this.toDispose_.push(this[name + onfire.model.Model.INSTANCE_SUFFIX]);
                break;

            default:
                throw new TypeError('Invalid property type for ' + name);
        }
    }

    // Model is now ready only when subordinate models are ready.
    var self = this;
    this.loadPromise_ = this.loadPromise_.
        then(function() {
            return onfire.utils.promise.all(promises);
        }).
        then(function() {
            return self;
        });
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

        var isLoaded = false;

        // Monitor VALUE events.
        self.ref.onValue(function(/** !Object */newValue) {

            self.handleValue_(newValue);

            // Resolve/reject promise upon first response.
            if (!isLoaded) {
                resolve(self);
                isLoaded = true;
            }
        }, undefined);
    });
};


/**
 * Stop monitoring add/remove of children.
 *
 * @private
 */
onfire.model.Model.prototype.stopMonitoring_ = function() {

    // Remove anything that the current instance is watching.
    // TODO: make this specific to the on() handlers, otherwise we cancel other watchers for the
    // same location, but elsewhere in the app.
    this.ref.off(undefined, undefined, this);
};


/**
 * Return a promise that is resolved to this instance when the data has been loaded.
 *
 * @return {!Promise<!onfire.model.Model,!Error>|!goog.Promise<!onfire.model.Model,!Error>}
 */
onfire.model.Model.prototype.whenLoaded = function() {

    return this.loadPromise_;
};


/**
 * Return the ID of the model.
 *
 * @return {string}
 * @export
 */
onfire.model.Model.prototype.key = function() {

    return this.ref.key();
};


/**
 * Determine whether the underlying data exists. We may have retrieved a non-existent object, or
 * it may have subsequently been deleted.
 *
 * @return {boolean}
 * @export
 */
onfire.model.Model.prototype.exists = function() {

    return !!this.storageObj;
};


/**
 * Handle an updated object.
 *
 * @param {Object} newValue
 * @private
 */
onfire.model.Model.prototype.handleValue_ = function(newValue) {

    this.storageObj = newValue;
    this.childrenCount = goog.object.getKeys(newValue).length;
};


/**
 * Get the value of a property.
 *
 * @param {string} propertyName The name of a property.
 * @return {Firebase.Value|onfire.model.Model}
 * @export
 */
onfire.model.Model.prototype.get = function(propertyName) {

    // TODO: validate that we have such a property.
    return this.getModel(propertyName) ||  this.getBasicValue(propertyName);
};


/**
 * Get a primitive value or an object that is not wrapped by an onfire.model.Model instance.
 *
 * @param {string} propertyName The name of a property.
 * @return {Firebase.Value}
 * @export
 */
onfire.model.Model.prototype.getBasicValue = function(propertyName) {

    // TODO: validate that we have such a property.
    return !!this.storageObj ? this.storageObj[propertyName] : null;
};


/**
 * Get the model instance that represents a property value.
 *
 * @param {string} propertyName The name of a property.
 * @return {!onfire.model.Model}
 * @export
 */
onfire.model.Model.prototype.getModel = function(propertyName) {

    // TODO: validate that we have such a property.
    return this[propertyName + onfire.model.Model.INSTANCE_SUFFIX];
};


/**
 * Change the primitive value of a property. Returns a a reference to the current model to allow
 * chaining.
 *
 * @param {string} propertyName The name of a property.
 * @param {Firebase.Value} value The primitive value to assign to the property.
 * @return {!onfire.model.Model}
 * @export
 */
onfire.model.Model.prototype.set = function(propertyName, value) {

    // TODO: validate that value is a Firebase.Value.
    // TODO: validate that value matches the schema.
    this.changes[propertyName] = value;
    this.hasChanges_ = true;

    return this;
};


/**
 * Commit the outstanding changes.
 *
 * @return {!Promise<!onfire.model.Model,!Error>|!goog.Promise<!onfire.model.Model,!Error>}
 * @export
 */
onfire.model.Model.prototype.save = function() {

    if (this.hasChanges_) {
        return this.update(this.changes).
            then(function(self) {
                // Reset the changes.
                self.changes = {};
                self.hasChanges_ = false;

                return self;
            });
    } else {
        return onfire.utils.promise.resolve(this);
    }
};


/**
 * Whether there are any usaved changes on this model.
 *
 * @return {boolean}
 * @export
 */
onfire.model.Model.prototype.hasChanges = function() {

    return this.hasChanges_;
};


/**
 * Change the primitive value of a set of properties atomically.
 *
 * @param {!Object<string,Firebase.Value>} pairs An object containing the property/value pairs to
 *        update.
 * @return {!Promise<!onfire.model.Model,!Error>|!goog.Promise<!onfire.model.Model,!Error>}
 * @protected
 */
onfire.model.Model.prototype.update = function(pairs) {

    // TODO: validate.
    // Remember the old values for comparison afterwards.
    var oldCount = this.childrenCount;
    var oldPairs = {};
    for (var p in pairs) {
        oldPairs[p] = this.get(p);
    }

    var self = this;
    return this.ref.update(pairs).
        then(function() {
            var promises = [];
            for(p in pairs) {
                if (oldPairs[p] !== pairs[p]) {
                    var valueRef = self.ref.child(p);
                    var pr = onfire.triggers.triggerValueChanged(valueRef, oldPairs[p],
                                pairs[p]);
                    promises.push(pr);
                }
            }
            return onfire.utils.promise.all(promises);
        }).
        then(function() {
            if (oldCount > 0 && self.childrenCount === 0) {
                // This object just disappeared because we set its remaining properties to null.
                onfire.utils.logging.info('REMOVED ' + self.ref.path());
                return onfire.triggers.triggerChildRemoved(self.ref.parent(), self);
            } else if (oldCount === 0 && self.childrenCount > 0) {
                // This object just came back into existence.
                onfire.utils.logging.info('CREATED ' + self.ref.path());
                return onfire.triggers.triggerChildAdded(self.ref.parent(), self);
            }
        }).
        then(function() {
            return self;
        });
};


/**
 * Sets values if the current object does not exist. Uses a transaction.
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
    then(function(result) {
        if (result['isCommitted']) {
            onfire.utils.logging.info('CREATED ' + self.ref.path());
            return onfire.triggers.triggerChildAdded(self.ref.parent(), self).
                then(function() {
                    return result;
                });
        } else {
            return result;
        }
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
