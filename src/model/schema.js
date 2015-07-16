goog.provide('onfire.model.schema');


/**
 * Determine the type of the provided value, taken from the right-hand-side of a schema property.
 * Does it represent a primitive, model or collection?
 *
 * @param {string|!Object|!function(new:onfire.model.Model, !onfire.Ref)} value
 * @return {onfire.model.schema.ValueType}
 * @package
 */
onfire.model.schema.determineValueType = function(value) {

    switch (typeof value) {

        case 'function':
            return onfire.model.schema.ValueType.CONSTRUCTOR;

        case 'object':
            // Detect the presence of an $id key.
            var idValue = value['$id'];
            if (goog.isDef(idValue)) {
                // The current value is an object that contains an $id key, i.e. a collection.
                return onfire.model.schema.ValueType.COLLECTION;
            } else {
                // There is no $id key --> use a regular model.
                return onfire.model.schema.ValueType.MODEL;
            }
    }

    // It should be a string that represents a primitive type.

    switch (value) {

        case 'string':
            return onfire.model.schema.ValueType.STRING;

        case 'number':
            return onfire.model.schema.ValueType.NUMBER;

        case 'boolean':
            return onfire.model.schema.ValueType.BOOLEAN;

        default:
            return onfire.model.schema.ValueType.UNKNOWN;
    }
};


/**
 * @enum {number}
 * @package
 */
onfire.model.schema.ValueType = {
    STRING: 0,
    NUMBER: 1,
    BOOLEAN: 2,
    MODEL: 3,
    COLLECTION: 4,
    CONSTRUCTOR: 5,
    UNKNOWN: -1
};
