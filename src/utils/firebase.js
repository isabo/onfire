/**
 * Promisify Firebase methods.
 */


goog.provide('onfire.utils.firebase');
goog.provide('onfire.utils.firebase.EventType');

goog.require('onfire.utils.promise');
goog.require('onfire.utils.detection');


if (onfire.utils.detection.IS_NODEJS) {
    /**
     * @private
     */
    onfire.utils.Firebase_ = /** @type {!function(new:Firebase, string)} */(require('firebase'));
} else {
    onfire.utils.Firebase_ = Firebase;
}


/**
 * Create a Firebase ref in a way that won't generate Closure Compiler errors.
 *
 * @param {string} path
 * @return {!Firebase}
 */
onfire.utils.firebase.newFirebase = function(path) {

    if (onfire.utils.detection.IS_NODEJS) {
        var fb = onfire.utils.Firebase_;
        return new fb(path);
    } else {
        return new Firebase(path);
    }
};


/**
 * Push a value under a Firebase reference.
 *
 * @param {!Firebase} ref
 * @param {Firebase.Value=} opt_value
 * @return {!Promise<!Firebase,!Error>|!goog.Promise<!Firebase,!Error>}
 */
onfire.utils.firebase.push = function(ref, opt_value) {
    return onfire.utils.promise.newPromise(function(resolve, reject) {
        if (goog.isDef(opt_value)) {
            var childRef = ref.push(opt_value, function(/** Error */err) {
                !err ? resolve(childRef) : reject(err);
            });
        } else {
            // Nothing to put there - just return the autogenerated ID.
            resolve(ref.push());
        }
    });
};


/**
 * Set the value at a Firebase reference.
 *
 * @param {!Firebase} ref
 * @param {Firebase.Value} value
 * @return {!Promise<null,!Error>|!goog.Promise<null,!Error>}
 */
onfire.utils.firebase.set = function(ref, value) {
    return onfire.utils.promise.newPromise(function(resolve, reject) {
        ref.set(value, function(/** Error */err) {
            !err ? resolve() : reject(err);
        });
    });
};


/**
 * Set the value at a Firebase reference.
 *
 * @param {!Firebase} ref
 * @param {!Object<string,Firebase.Value>} values
 * @return {!Promise<null,!Error>|!goog.Promise<null,!Error>}
 */
onfire.utils.firebase.update = function(ref, values) {
    return onfire.utils.promise.newPromise(function(resolve, reject) {
        ref.update(values, function(/** Error */err) {
            !err ? resolve() : reject(err);
        });
    });
};


/**
 * Performs an atomic transaction at a Firebase reference.
 *
 * @param {!Firebase} ref
 * @param {function(Firebase.Value):(Firebase.Value|undefined)} updateFn
 * @return
    {
        !Promise<!{{isCommitted:boolean,snapshot:Firebase.DataSnapshot}},!Error>
        |
        !goog.Promise<!{{isCommitted:boolean,snapshot:Firebase.DataSnapshot}},!Error>
    }
 */
onfire.utils.firebase.transaction = function(ref, updateFn) {
    return onfire.utils.promise.newPromise(function(resolve, reject) {
        ref.transaction(updateFn,
            function(/**Error*/err, /**boolean*/isCommitted, /**!Firebase.DataSnapshot*/snapshot) {
                !err ? resolve({'isCommitted': isCommitted, 'snapshot': snapshot}) : reject(err);
            }, false);
    });
};


/**
 * Set the value at a Firebase reference.
 *
 * @param {!Firebase} ref
 * @return {!Promise<null,!Error>|!goog.Promise<null,!Error>}
 */
onfire.utils.firebase.remove = function(ref) {
    return onfire.utils.promise.newPromise(function(resolve, reject) {
        ref.remove(function(/** Error */err) {
            !err ? resolve() : reject(err);
        });
    });
};


/**
 * Wait for the first event of a specified type at a Firebase reference.
 *
 * @param {!Firebase} ref
 * @param {onfire.utils.firebase.EventType} eventType
 * @return {!Promise<!Firebase.DataSnapshot,!Error>|!goog.Promise<!Firebase.DataSnapshot,!Error>}
 */
onfire.utils.firebase.once = function(ref, eventType) {
    return onfire.utils.promise.newPromise(function(resolve, reject) {
        ref.once(eventType, function(/** !Firebase.DataSnapshot */snapshot) {
            resolve(snapshot);
        }, function(err) {
            reject(err);
        });
    });
};


/**
 * @enum {string}
 */
onfire.utils.firebase.EventType = {
    VALUE: 'value',
    CHILD_ADDED: 'child_added',
    CHILD_CHANGED: 'child_changed',
    CHILD_REMOVED: 'child_removed',
    CHILD_MOVED: 'child_moved'
};


onfire.utils.firebase.TIMESTAMP = onfire.utils.Firebase_.ServerValue.TIMESTAMP;
