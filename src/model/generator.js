goog.provide('onfire.model.generator');

goog.require('onfire.model.config');
goog.require('onfire.model.Model');
goog.require('onfire.model.Collection');


/**
 * Generate a subclass of onfire.model.Model or onfire.model.Collection with a baked in
 * configuration.
 *
 * @param {!Object|!function(new:onfire.model.Model, !onfire.Ref)} configOrCtor A configuration
 *      object or a reference to a predefined Model subclass constructor.
 * @return {!function(new:onfire.model.Model, !onfire.Ref)}
 */
onfire.model.generator.generateConstructor = function(configOrCtor) {

    switch (typeof configOrCtor) {

        case 'function':
            return configOrCtor;

        case 'object':
            break;

        default:
            throw new Error('Invalid config - it must be an object or a constructor!');
    }

    // It's an object. Does it represent a collection?
    if (onfire.model.config.determineValueType(configOrCtor) === onfire.model.config.ValueType.COLLECTION) {
        return onfire.model.generator.generateCollectionCtor_(configOrCtor);
    } else {
        return onfire.model.generator.generateModelCtor_(configOrCtor);
    }
};


/**
 * Generate a subclass of onfire.model.Model with a baked in configuration.
 *
 * @param {!Object} config
 * @return {!function(new:onfire.model.Model, !onfire.Ref)}
 */
onfire.model.generator.generateModelCtor_ = function(config) {

    /**
     * @constructor
     * @extends {onfire.model.Model}
     */
    var Model = function(ref) {
        Model.base(this, 'constructor', ref);
        // Instantiate models to represent any non-primitive properties.
        this.configureInstance(config);
    };
    goog.inherits(Model, onfire.model.Model);

    // Add prototype methods and generate subordinate constructors.
    onfire.model.generator.configureCtor_(Model, config);

    return Model;
};


/**
 * Generate a subclass of onfire.model.Collection with a baked in configuration.
 *
 * @param {{$id:(string|!Object|!function(new:onfire.model.Model))}} config
 * @return {!function(new:onfire.model.Model, !onfire.Ref)}
 * @private
 */
onfire.model.generator.generateCollectionCtor_ = function(config) {

    // Collection members may be primitives or models.
    // Prepare a class with a baked in configuration, to be used for instantiating collection
    // members if they are not primitives.
    var memberConfig = config['$id'];
    var type = onfire.model.config.determineValueType(memberConfig);
    var memberCtor;

    switch (type) {
        case onfire.model.config.ValueType.STRING:
        case onfire.model.config.ValueType.NUMBER:
        case onfire.model.config.ValueType.BOOLEAN:
            break;

        case onfire.model.config.ValueType.CONSTRUCTOR:
            memberCtor = memberConfig;
            break;

        case onfire.model.config.ValueType.MODEL:
        case onfire.model.config.ValueType.COLLECTION:
            memberCtor = onfire.model.generator.generateModelCtor_(memberConfig);
            break;

        default:
            break;
    }

    /**
     * @constructor
     * @extends {onfire.model.Collection}
     */
    var Collection = function(ref) {
        Collection.base(this, 'constructor', ref, memberCtor);
    };
    goog.inherits(Collection, onfire.model.Collection);

    return Collection;
};



/**
 * Adds properties and subordinate model prototypes to a model constructor, based on a configuration
 * object.
 *
 * @param {!function(new:onfire.model.Model, !onfire.Ref)} ctor
 * @param {!Object} config
 * @private
 */
onfire.model.generator.configureCtor_ = function(ctor, config) {

    for (var name in config) {

        var rhs = config[name];
        var valueType = onfire.model.config.determineValueType(rhs);

        switch (valueType) {

            case onfire.model.config.ValueType.STRING:
            case onfire.model.config.ValueType.NUMBER:
            case onfire.model.config.ValueType.BOOLEAN:

                // A primitive type name. Add a get/set method for it.
                if (ctor.prototype[name] === undefined) {
                    ctor.prototype[name] = onfire.model.generator.generateGetterSetter_(name);
                } else {
                    onfire.utils.logging.warn(name + ' clashes with a built-in property or method. ' +
                        'Use the generic .get(' + name + ') / .set(' + name +
                        ', value) methods to access this property.');
                }
                break;

            case onfire.model.config.ValueType.CONSTRUCTOR:
            case onfire.model.config.ValueType.MODEL:
            case onfire.model.config.ValueType.COLLECTION:

                // The value is the config for a subordinate model.

                // Generate a constructor for the appropriate model or collection.
                ctor.prototype[name + onfire.model.Model.CONSTRUCTOR_SUFFIX] =
                    onfire.model.generator.generateConstructor(rhs);

                // Add a getter for it.
                if (ctor.prototype[name] === undefined) {
                    ctor.prototype[name] = onfire.model.generator.generateGetter_(name);
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
 * Generate a get/set method for a model property.
 *
 * @param {string} propertyName The name of the property to create a get/set method for.
 * @return {function(Firebase.Value=):(Firebase.Value|onfire.model.Model|null)}
 * @private
 */
onfire.model.generator.generateGetterSetter_ = function(propertyName) {

    /**
     * @this {onfire.model.Model}
     * @param {Firebase.Value=} opt_value
     * @return {Firebase.Value|onfire.model.Model|null}
     */
    var getterSetter = function(opt_value) {

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
onfire.model.generator.generateGetter_ = function(propertyName) {

    /**
     * @this {onfire.model.Model}
     * @return {Firebase.Value}
     */
    var get = function() {

        return this.get(propertyName);
    };

    return get;
};
