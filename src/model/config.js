goog.provide('onfire.model.config');


/**
 * Determine the type of the provided value, taken from the right-hand-side of a config property.
 * Does it represent a primitive, model or collection?
 *
 * @param {string|!Object|!function(new:onfire.model.Model, !onfire.Ref)} value
 * @return {onfire.model.config.ValueType}
 * @package
 */
onfire.model.config.determineValueType = function(value) {

    switch (typeof value) {

        case 'function':
            return onfire.model.config.ValueType.CONSTRUCTOR;

        case 'object':
            // Detect the presence of an $id key.
            var idValue = value['$id'];
            if (goog.isDef(idValue)) {
                // The current value is an object that contains an $id key, i.e. a collection.
                return onfire.model.config.ValueType.COLLECTION;
            } else {
                // There is no $id key --> use a regular model.
                return onfire.model.config.ValueType.MODEL;
            }
    }

    // It should be a string that represents a primitive type.

    switch (value) {

        case 'string':
            return onfire.model.config.ValueType.STRING;

        case 'number':
            return onfire.model.config.ValueType.NUMBER;

        case 'boolean':
            return onfire.model.config.ValueType.BOOLEAN;

        default:
            return onfire.model.config.ValueType.UNKNOWN;
    }
};


/**
 * @enum {number}
 * @package
 */
onfire.model.config.ValueType = {
    STRING: 0,
    NUMBER: 1,
    BOOLEAN: 2,
    MODEL: 3,
    COLLECTION: 4,
    CONSTRUCTOR: 5,
    UNKNOWN: -1
};
