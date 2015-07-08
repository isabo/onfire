/**
 * Provide a standardised logging interface.
 */


goog.provide('onfire.utils.logging');


/**
 * @const {string}
 */
onfire.utils.logging.PREFIX = 'ONFIRE:';


/**
 * Log some normal info.
 *
 * @param {...?} var_args
 */
onfire.utils.logging.info = function(var_args){

    onfire.utils.logging.write_('info', arguments);
};


/**
 * Log a warning.
 *
 * @param {...?} var_args
 */
onfire.utils.logging.warn = function(var_args){

    onfire.utils.logging.write_('warn', arguments);
};


/**
 * Log an error.
 *
 * @param {...?} var_args
 */
onfire.utils.logging.error = function(var_args){

    onfire.utils.logging.write_('error', arguments);
};


/**
 * @param {string} verb
 * @param {{length: number}} var_args The built-in 'arguments' array-like object from the caller.
 * @private
 */
onfire.utils.logging.write_ = function(verb, var_args){

    var args = Array.prototype.slice.call(var_args, 0);
    args.unshift(onfire.utils.logging.PREFIX);
    if (typeof console[verb] === 'function') {
        console[verb].apply(console, args);
    } else {
        console.log.apply(console, args);
    }
};
