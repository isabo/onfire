goog.provide('onfire.modelling');

goog.require('onfire.Model');
goog.require('onfire.Collection');


/**
 * Generate a subclass of onfire.Model or onfire.Collection with a baked in configuration.
 *
 * @param {!Object|!function(new:onfire.Model, !onfire.Ref)} configOrCtor A configuration object
 *      or a reference to a predefined Model subclass constructor.
 * @return {!function(new:onfire.Model, !onfire.Ref)}
 * @export
 */
onfire.modelling.generateConstructor = function (configOrCtor) {

    switch (typeof configOrCtor) {

        case 'function':
            return configOrCtor;

        case 'object':
            break;

        default:
            throw new Error('Invalid config - it must be an object or a constructor!');
    }

    // It's an object. Does it represent a collection?
    if (onfire.modelling.determineValueType_(configOrCtor) === onfire.modelling.ValueType.COLLECTION) {
        return onfire.modelling.generateCollectionCtor_(configOrCtor);
    } else {
        return onfire.modelling.generateModelCtor_(configOrCtor);
    }
};


/**
 * Generate a subclass of onfire.Model with a baked in configuration.
 *
 * @param {!Object} config
 * @return {!function(new:onfire.Model, !onfire.Ref)}
 */
onfire.modelling.generateModelCtor_ = function (config) {

    /**
     * @constructor
     * @extends {onfire.Model}
     */
    var Model = function(ref) {
        Model.base(this, 'constructor', ref);
        // Instantiate models to represent any non-primitive properties.
        this.loadSubordinateModels(config);
    };
    goog.inherits(Model, onfire.Model);

    // Add prototype methods and generate subordinate constructors.
    onfire.modelling.configureCtor_(Model, config);

    return Model;
};


/**
 * Generate a subclass of onfire.Collection with a baked in configuration.
 *
 * @param {{$id:(string|!Object|!function(new:onfire.Model))}} config
 * @return {!function(new:onfire.Model, !onfire.Ref)}
 * @private
 */
onfire.modelling.generateCollectionCtor_ = function (config) {

    // Collection members may be primitives or models.
    // Prepare a class with a baked in configuration, to be used for instantiating collection
    // members if they are not primitives.
    var memberConfig = config['$id'];
    var type = onfire.modelling.determineValueType_(memberConfig);
    var memberCtor;

    switch (type) {
        case onfire.modelling.ValueType.STRING:
        case onfire.modelling.ValueType.NUMBER:
        case onfire.modelling.ValueType.BOOLEAN:
            break;

        case onfire.modelling.ValueType.CONSTRUCTOR:
            memberCtor = memberConfig;
            break;

        case onfire.modelling.ValueType.MODEL:
        case onfire.modelling.ValueType.COLLECTION:
            memberCtor = onfire.modelling.generateModelCtor_(memberConfig);
            break;

        default:
            break;
    }

    /**
     * @constructor
     * @extends {onfire.Collection}
     */
    var Collection = function(ref) {
        Collection.base(this, 'constructor', ref, memberCtor);
    };
    goog.inherits(Collection, onfire.Collection);

    return Collection;
};



/**
 * Adds properties and subordinate model prototypes to a model constructor, based on a configuration
 * object.
 *
 * @param {!function(new:onfire.Model, !onfire.Ref)} ctor
 * @param {!Object} config
 * @private
 */
onfire.modelling.configureCtor_ = function (ctor, config) {

    for (var name in config) {

        if (goog.string.startsWith(name, '_') || goog.string.startsWith(name, '$')) {
            continue;
        }

        var rhs = config[name];
        var valueType = onfire.modelling.determineValueType_(rhs);

        switch (valueType) {

            case onfire.modelling.ValueType.STRING:
            case onfire.modelling.ValueType.NUMBER:
            case onfire.modelling.ValueType.BOOLEAN:

                // A primitive type name. Add a get/set method for it.
                if (ctor.prototype[name] === undefined) {
                    ctor.prototype[name] = onfire.modelling.generateGetterSetter_(name);
                } else {
                    onfire.utils.logging.warn(name + ' clashes with a built-in property or method. ' +
                        'Use the generic .get(' + name + ') / .set(' + name +
                        ', value) methods to access this property.');
                }
                break;

            case onfire.modelling.ValueType.CONSTRUCTOR:
            case onfire.modelling.ValueType.MODEL:
            case onfire.modelling.ValueType.COLLECTION:

                // The value is the config for a subordinate model.

                // Generate a constructor for the appropriate model or collection.
                ctor.prototype[name + onfire.modelling.CONSTRUCTOR_SUFFIX] =
                    onfire.modelling.generateConstructor(rhs);

                // Add a getter for it.
                if (ctor.prototype[name] === undefined) {
                    ctor.prototype[name] = onfire.modelling.generateGetter_(name);
                } else {
                    onfire.utils.logging.warn(name + ' clashes with a built-in property or method. ' +
                        'Use the generic .getModel(' + name + ') method to access this property.');
                }
                break;

            default:
                throw new TypeError('Invalid property type for ' + name);
        }
    }
};


/**
 * Determine the type of the provided value, taken from the right-hand-side of a config property.
 * Does it represent a primitive, model or collection?
 *
 * @param {string|!Object|!function(new:onfire.Model, !onfire.Ref)} value
 * @return {onfire.modelling.ValueType}
 * @private
 */
onfire.modelling.determineValueType_ = function (value) {

    switch (typeof value) {

        case 'function':
            return onfire.modelling.ValueType.CONSTRUCTOR;

        case 'object':
            // Detect the presence of an $id key.
            var idValue = value['$id'];
            if (goog.isDef(idValue)) {
                // The current value is an object that contains an $id key, i.e. a collection.
                return onfire.modelling.ValueType.COLLECTION;
            } else {
                // There is no $id key --> use a regular model.
                return onfire.modelling.ValueType.MODEL;
            }
    }

    // It should be a string that represents a primitive type.

    switch (value) {

        case 'string':
            return onfire.modelling.ValueType.STRING;

        case 'number':
            return onfire.modelling.ValueType.NUMBER;

        case 'boolean':
            return onfire.modelling.ValueType.BOOLEAN;

        default:
            return onfire.modelling.ValueType.UNKNOWN;
    }
};


/**
 * Generate a get/set method for a model property.
 *
 * @param {string} propertyName The name of the property to create a get/set method for.
 * @return {function(Firebase.Value=):(Firebase.Value|onfire.Model|null)}
 * @private
 */
onfire.modelling.generateGetterSetter_ = function (propertyName) {

    /**
     * @this {onfire.Model}
     * @param {Firebase.Value=} opt_value
     * @return {Firebase.Value|onfire.Model|null}
     */
    var getterSetter = function (opt_value) {

        if (arguments.length === 0) {
            return this.get(propertyName);
        } else {
            return this.set(propertyName, opt_value);
        }
    };

    return getterSetter;
};


/**
 * Generate a get method for a model property.
 *
 * @param {string} propertyName The name of the property to create a get method for.
 * @return {function():Firebase.Value}
 * @private
 */
onfire.modelling.generateGetter_ = function(propertyName){

    /**
     * @this {onfire.Model}
     * @return {Firebase.Value}
     */
    var get = function(){

        return this.get(propertyName);
    };

    return get;
};


/**
 * @enum {number}
 * @private
 */
onfire.modelling.ValueType = {
    STRING: 0,
    NUMBER: 1,
    BOOLEAN: 2,
    MODEL: 3,
    COLLECTION: 4,
    CONSTRUCTOR: 5,
    UNKNOWN: -1
};


/**
 * @const {string}
 * @private
 */
onfire.modelling.CONSTRUCTOR_SUFFIX = 'Ctor_';
