goog.provide('onfire.model.factory');

goog.require('onfire.model.schema');
goog.require('onfire.model.Model');
goog.require('onfire.model.Collection');


/**
 * Generate a subclass of onfire.model.Model or onfire.model.Collection with a baked in schema.
 *
 * @param {!Object|!function(new:onfire.model.Model, !onfire.Ref)} schemaOrCtor A schema object or
 *      a reference to a predefined Model subclass constructor.
 * @return {!function(new:onfire.model.Model, !onfire.Ref)}
 */
onfire.model.factory.defineModel = function(schemaOrCtor) {

    switch (typeof schemaOrCtor) {

        case 'function':
            return schemaOrCtor;

        case 'object':
            break;

        default:
            throw new Error('Invalid schema - it must be an object or a constructor!');
    }

    // It's an object. Does it represent a collection?
    if (onfire.model.schema.determineValueType(schemaOrCtor) ===
            onfire.model.schema.ValueType.COLLECTION) {
        return onfire.model.factory.generateCollectionCtor_(schemaOrCtor);
    } else {
        return onfire.model.factory.generateModelCtor_(schemaOrCtor);
    }
};


/**
 * Generate a subclass of onfire.model.Model with a baked in schema.
 *
 * @param {!Object} schema
 * @return {!function(new:onfire.model.Model, !onfire.Ref)}
 */
onfire.model.factory.generateModelCtor_ = function(schema) {

    /**
     * @constructor
     * @extends {onfire.model.Model}
     */
    var Model = function(ref) {
        Model.base(this, 'constructor', ref);
        // Instantiate models to represent any non-primitive properties.
        this.configureInstance(schema);
    };
    goog.inherits(Model, onfire.model.Model);

    // Add prototype methods and generate subordinate constructors.
    onfire.model.factory.configureCtor_(Model, schema);

    return Model;
};


/**
 * Generate a subclass of onfire.model.Collection with a baked in schema.
 *
 * @param {{$id:(string|!Object|!function(new:onfire.model.Model))}} schema
 * @return {!function(new:onfire.model.Model, !onfire.Ref)}
 * @private
 */
onfire.model.factory.generateCollectionCtor_ = function(schema) {

    // Collection members may be primitives or models.
    // Prepare a class with a baked in schema, to be used for instantiating collection
    // members if they are not primitives.
    var memberSchema = schema['$id'];
    var type = onfire.model.schema.determineValueType(memberSchema);
    var memberCtor;

    switch (type) {
        case onfire.model.schema.ValueType.STRING:
        case onfire.model.schema.ValueType.NUMBER:
        case onfire.model.schema.ValueType.BOOLEAN:
            break;

        case onfire.model.schema.ValueType.CONSTRUCTOR:
            memberCtor = memberSchema;
            break;

        case onfire.model.schema.ValueType.MODEL:
        case onfire.model.schema.ValueType.COLLECTION:
            memberCtor = onfire.model.factory.generateModelCtor_(memberSchema);
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
 * Adds properties and subordinate model prototypes to a model constructor, based on a schema
 * object.
 *
 * @param {!function(new:onfire.model.Model, !onfire.Ref)} ctor
 * @param {!Object} schema
 * @private
 */
onfire.model.factory.configureCtor_ = function(ctor, schema) {

    for (var name in schema) {

        var rhs = schema[name];
        var valueType = onfire.model.schema.determineValueType(rhs);

        switch (valueType) {

            case onfire.model.schema.ValueType.STRING:
            case onfire.model.schema.ValueType.NUMBER:
            case onfire.model.schema.ValueType.BOOLEAN:

                // A primitive type name. Add a get/set method for it.
                if (ctor.prototype[name] === undefined) {
                    ctor.prototype[name] = onfire.model.factory.generateGetterSetter_(name);
                } else {
                    onfire.utils.logging.warn(name + ' clashes with a built-in property or method. ' +
                        'Use the generic .get(' + name + ') / .set(' + name +
                        ', value) methods to access this property.');
                }
                break;

            case onfire.model.schema.ValueType.CONSTRUCTOR:
            case onfire.model.schema.ValueType.MODEL:
            case onfire.model.schema.ValueType.COLLECTION:

                // The value is the schema for a subordinate model.

                // Generate a constructor for the appropriate model or collection.
                ctor.prototype[name + onfire.model.Model.CONSTRUCTOR_SUFFIX] =
                    onfire.model.factory.defineModel(rhs);

                // Add a getter for it.
                if (ctor.prototype[name] === undefined) {
                    ctor.prototype[name] = onfire.model.factory.generateGetter_(name);
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
onfire.model.factory.generateGetterSetter_ = function(propertyName) {

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
onfire.model.factory.generateGetter_ = function(propertyName) {

    /**
     * @this {onfire.model.Model}
     * @return {Firebase.Value}
     */
    var get = function() {

        return this.get(propertyName);
    };

    return get;
};
