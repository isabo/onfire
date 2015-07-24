goog.provide('onfire.model.Error');


/**
 * Error messages that are thrown.
 *
 * @enum {string}
 * @export
 */
onfire.model.Error = {

    /**
     * Thrown when the argument provided to the constructor is not an onfire.Ref instance.
     */
    'INVALID_REF': 'Invalid ref argument - it must be an onfire.Ref instance',

    /**
     * Thrown when a property or method is accessed before the model has finished loading, and the
     * result would be incorrect or unavailable.
     */
    'NOT_LOADED': 'Not loaded yet',

    /**
     * Thrown when an attempt is made to get or set the value of a key that is not specified in the
     * schema and does not exist in the underlying data.
     */
    'NO_SUCH_KEY': 'No such key',

    /**
     * Thrown when an attempt is made to obtain a model to represent a primitive value, e.g. calling
     * .getModel('abc') when .abc has an integer value according to the schema or in reality.
     * Another example is calling a collection's .create(), .fetch() or fetchOrCreate() methods
     * when the collection is a colection of primitive values and not models.
     */
    'NOT_A_MODEL': 'Not a model',

    /**
     * Thrown when an attempt is made to assign a value to a key that represents a model. Any
     * changes need to be assigned via the model itself. In order to add a model instance to a
     * collection use .create() or .fetchOrCreate() instead of .set().
     */
    'NOT_A_PRIMITIVE': 'Not a primitive'
};
