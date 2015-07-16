goog.provide('onfire.Ref');

goog.require('onfire.utils.firebase');
goog.require('onfire.utils.firebase.EventType');
goog.require('onfire.utils.logging');
goog.require('goog.Uri');


/**
 * Wrapper for Firebase references. Includes promisification of common methods.
 *
 * @param {!Firebase} ref
 * @constructor
 * @final
 * @export
 */
onfire.Ref = function(ref) {

    /**
     * @type {!Firebase}
     * @private
     */
    this.ref_ = ref;
};


/**
 * @param {string} childName
 * @param {string=} opt_id
 * @return {!onfire.Ref}
 * @export
 */
onfire.Ref.prototype.child = function(childName, opt_id) {

    var ref = this.ref_.child(childName);

    var toReturn = goog.isDefAndNotNull(opt_id) ? ref.child(/** @type {string} */(opt_id)) : ref;
    return new onfire.Ref(toReturn);
};


/**
 * Return a Ref that represents the root of the tree.
 *
 * @return {!onfire.Ref}
 * @export
 */
onfire.Ref.prototype.root = function() {

    return new onfire.Ref(this.ref_.root());
};


/**
 * Push a value under this reference. Returns a promise that resolves to the Ref of the newly pushed
 * child.
 *
 * @param {Firebase.Value=} opt_value
 * @return {!Promise<!onfire.Ref,!Error>|!goog.Promise<!onfire.Ref,!Error>}
 * @export
 */
onfire.Ref.prototype.push = function(opt_value) {

    onfire.utils.logging.info('PUSH ' + this.path() + ' :', opt_value);

    var self = this;
    return onfire.utils.firebase.push(this.ref_, opt_value).
        then(function(/** !Firebase */ref) {
            onfire.utils.logging.info('PUSH (Success) ' + self.path() + ' :', opt_value);
            return new onfire.Ref(ref);
        }, function(err) {
            onfire.utils.logging.error('PUSH (Failure) ' + self.path() + ' :', opt_value, err);
            throw err;
        });
};


/**
 * Generate a push ID. This takes the place of push when all we want is a unique ID, not via a
 * promise.
 *
 * @return {string}
 * @export
 */
onfire.Ref.prototype.generateId = function() {

    return this.ref_.push().key();
};


/**
 * Set the value of this reference.
 *
 * @param {Firebase.Value} value
 * @return {!Promise<null,!Error>|!goog.Promise<null,!Error>}
 * @export
 */
onfire.Ref.prototype.set = function(value) {

    onfire.utils.logging.info('SET ' + this.path() + ' :', value);

    var self = this;
    return onfire.utils.firebase.set(this.ref_, value).
        then(function() {
            onfire.utils.logging.info('SET (Success) ' + self.path() + ' :', value);
            return null;
        }, function(err) {
            onfire.utils.logging.error('SET (Failure) ' + self.path() + ' :', value, err);
            throw err;
        });
};


/**
 * Update multiple property/value pairs under this reference.
 *
 * @param {!Object<string,Firebase.Value>} values
 * @return {!Promise<null,!Error>|goog.Promise<null,!Error>}
 * @export
 */
onfire.Ref.prototype.update = function(values) {

    onfire.utils.logging.info('UPDATE ' + this.path() + ' :', values);

    var self = this;
    return onfire.utils.firebase.update(this.ref_, values).
        then(function() {
            onfire.utils.logging.info('UPDATE (Success) ' + self.path() + ' :', values);
            return null;
        }, function(err) {
            onfire.utils.logging.error('UPDATE (Failure) ' + self.path() + ' :', values, err);
            throw err;
        });
};


/**
 * Set a value atomically.
 *
 * @param {Firebase.TransactionUpdateFunction} updateFn
 * @return
    {
        !Promise<!{{isCommitted:boolean,snapshot:Firebase.DataSnapshot}},!Error>
        |
        !goog.Promise<!{{isCommitted:boolean,snapshot:Firebase.DataSnapshot}},!Error>
    }
 * @export
 */
onfire.Ref.prototype.transaction = function(updateFn) {

    onfire.utils.logging.info('TRANSACTION at ' + this.path());

    var self = this;
    return onfire.utils.firebase.transaction(this.ref_, updateFn).
        then(function(/** !Object */result) {
            var msg = result['isCommitted'] ? 'Committed' : 'Not Committed';
            onfire.utils.logging.info('TRANSACTION ' + msg + ' at ' + self.path() + ' :',
                result['snapshot'].val());
            return result;
        }, function(err) {
            onfire.utils.logging.error('TRANSACTION Failed at ' + self.path());
            throw err;
        });
};


/**
 * Remove the data at this reference.
 *
 * @return {!Promise<null,!Error>|!goog.Promise<null,!Error>}
 * @export
 */
onfire.Ref.prototype.remove = function() {

    onfire.utils.logging.info('REMOVE ' + this.path());

    var self = this;
    return onfire.utils.firebase.remove(this.ref_).
        then(function() {
            onfire.utils.logging.info('REMOVE (Success) ' + self.path());
            return null;
        }, function(err) {
            onfire.utils.logging.error('REMOVE (Failure) ' + self.path(), err);
            throw err;
        });
};


/**
 * Wait for the first event of a specified type at this reference.
 *
 * @param {onfire.utils.firebase.EventType} eventType
 * @return {!Promise<!Firebase.DataSnapshot,!Error>|!goog.Promise<!Firebase.DataSnapshot,!Error>}
 * @export
 */
onfire.Ref.prototype.once = function(eventType) {

    onfire.utils.logging.info('ONCE ' + eventType.toUpperCase() +  ' ' + this.path());

    var self = this;
    return onfire.utils.firebase.once(this.ref_, eventType).
        then(function(/** !Firebase.DataSnapshot */snapshot) {
            onfire.utils.logging.info('ONCE ' + eventType.toUpperCase() +  ' (Success) ' +
                self.path(), snapshot.val());
            return snapshot;
        }, function(err) {
            onfire.utils.logging.error('ONCE ' + eventType.toUpperCase() +  ' (Failure) ' +
                self.path(), err);
            throw err;
        });
};


/**
 * Retrieve the value at this reference. This is shorthand for calling .once for the 'value' event
 * and then extracting the value of the returned snapshot.
 *
 * @return {!Promise<Firebase.Value,!Error>|!goog.Promise<Firebase.Value,!Error>}
 * @export
 */
onfire.Ref.prototype.onceValue = function() {

    return this.once(onfire.utils.firebase.EventType.VALUE).
        then(function(/** !Firebase.DataSnapshot */snapshot) {
            return snapshot.val();
        });
};


/**
 * Register a callback for an event of a specified type at this reference. Keep the return value
 * for use when turning this off. See the off() method.
 *
 * @param {onfire.utils.firebase.EventType} eventType
 * @param {!Firebase.EventCallback} callback
 * @param {function(!Error)=} cancelCallback
 * @param {Object=} context
 * @return {!function(!Firebase.DataSnapshot, ?string=)}
 * @export
 */
onfire.Ref.prototype.on = function(eventType, callback, cancelCallback, context) {

    var self = this;

    /**
     * @param {!Firebase.DataSnapshot} snapshot
     * @param {?string=} prevKey
     */
    var cbWrapper = function(snapshot, prevKey) {
        onfire.utils.logging.info(eventType.toUpperCase() +  ' at ' + self.path(), snapshot.val());
        callback.call(context, snapshot, prevKey);
    };

    /**
     * @param {!Error} err
     */
    var cancelWrapper = function(err) {
        onfire.utils.logging.error(eventType.toUpperCase() +  ' CANCELLED at ' + self.path(), err);
        if (typeof cancelCallback === 'function') {
            cancelCallback.call(context, err);
        }
    };

    return this.ref_.on(eventType, cbWrapper, cancelWrapper);
};


/**
 * Unregister a previously registered callback.
 *
 * @param {onfire.utils.firebase.EventType=} opt_eventType
 * @param {!Firebase.EventCallback=} opt_callback This MUST be the wrapped callback returned by the
 *         .on() method.
 * @param {!Object=} opt_context
 * @export
 */
onfire.Ref.prototype.off = function(opt_eventType, opt_callback, opt_context) {

    this.ref_.off(opt_eventType, opt_callback, opt_context);
};


/**
 * Register a callback for value changes at this reference. This is shorthand for calling .on for
 * the 'value' event and then extracting the value of each returned snapshot.
 * Keep the return value for when you want to turn this off. See the offValue method.
 *
 * @param {!function(Firebase.Value)} callback
 * @param {!function(!Error)=} cancelCallback
 * @param {!Object=} context
 * @return {!function(!Firebase.DataSnapshot)}
 * @export
 */
onfire.Ref.prototype.onValue = function(callback, cancelCallback, context) {

    // Wrap the callback in a function that unwraps the value from the snapshot.
    var unwrapAndCallBack = function(/** !Firebase.DataSnapshot */snapshot) {
        callback.call(context, snapshot.val());
    };

    return this.on(onfire.utils.firebase.EventType.VALUE, unwrapAndCallBack, cancelCallback,
        context);
};


/**
 * Unregister a previously registered onValue callback.
 *
 * @param {!function(Firebase.Value)} callback This MUST be the wrapped callback returned
 *         by .onValue().
 * @param {!Object=} context
 * @export
 */
onfire.Ref.prototype.offValue = function(callback, context) {

    this.off(onfire.utils.firebase.EventType.VALUE, callback, context);
};


/**
 * Return the unwrapped Firebase Ref.
 *
 * @return {!Firebase}
 * @export
 */
onfire.Ref.prototype.ref = function() {

    return this.ref_;
};


/**
 * Get the parent reference of this reference.
 *
 * @return {onfire.Ref}
 * @export
 */
onfire.Ref.prototype.parent = function() {

    var parent = this.ref_.parent();
    return parent ? new onfire.Ref(parent) : null;
};


/**
 * Get the ID of this reference.
 *
 * @return {string}
 * @export
 */
onfire.Ref.prototype.key = function() {

    return this.ref_.key();
};


/**
 * Get the path of this reference from the root, i.e. not including the firebaseio.com domain.
 *
 * @return {string}
 * @export
 */
onfire.Ref.prototype.path = function() {

    // Only parse the path the first time, then re-use.
    return this.path_ ||
        (this.path_ = decodeURIComponent(goog.Uri.parse(this.ref_.toString()).getPath()) || '/');
};
