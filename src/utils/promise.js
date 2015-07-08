/**
 * Provide platform-independent promise methods.
 */


goog.provide('onfire.utils.promise');

goog.require('goog.Promise');


/**
 * Detect whether Promise is already implemented by our host process.
 *
 * @const {boolean}
 * @private
 */
onfire.utils.promise.IS_IMPLEMENTED_ = (typeof Promise !== 'undefined');


/**
 * Instantiates a new promise.
 * Browser based code will use goog.Promise.
 *
 * @param {function(function(T=), function(E))} resolver
 * @return {!Promise<T,E>|!goog.Promise<T,E>}
 * @template T, E
 */
onfire.utils.promise.newPromise = function(resolver) {

    if (onfire.utils.promise.IS_IMPLEMENTED_){
        return new Promise(resolver);
    } else {
        return new goog.Promise(resolver);
    }
};


/**
 * Creates a resolved promise.
 *
 * @param {T} value
 * @return {!Promise<T>|!goog.Promise<T>}
 * @template T
 */
onfire.utils.promise.resolve = function(value) {

    if (onfire.utils.promise.IS_IMPLEMENTED_){
        return Promise.resolve(value);
    } else {
        return goog.Promise.resolve(value);
    }
};


/**
 * Creates a rejected promise.
 *
 * @param {!Error} err
 * @return {!Promise|!goog.Promise}
 */
onfire.utils.promise.reject = function(err) {

    if (onfire.utils.promise.IS_IMPLEMENTED_){
        return Promise.reject(err);
    } else {
        return goog.Promise.reject(err);
    }
};


/**
 * Creates a promise from an array of promises.
 *
 * @param {!Array<(!Promise<T,E>|!goog.Promise<T,E>)>} promises
 * @return {!Promise<!Array<T>,E>|!goog.Promise<!Array<T>,E>}
 * @template T, E
 */
onfire.utils.promise.all = function(promises) {

    if (onfire.utils.promise.IS_IMPLEMENTED_){
        return Promise.all(promises);
    } else {
        return goog.Promise.all(/** @type {!Array<!goog.Thenable<?>>}*/(promises));
    }
};
