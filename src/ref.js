goog.provide('onfire.Ref');

goog.require('onfire.utils.firebase');
goog.require('onfire.utils.firebase.EventType');
goog.require('onfire.utils.logging');
goog.require('goog.Uri');


/**
 * An analogue of a Firebase reference.
 * @see https://www.firebase.com/docs/web/api/firebase/constructor.html
 *
 * @param {string|!Firebase} urlOrRef A Firebase URL or a Firebase reference instance.
 * @constructor
 * @final
 * @export
 */
onfire.Ref = function(urlOrRef) {

    if (typeof urlOrRef === 'string') {
        urlOrRef = onfire.utils.firebase.newFirebase(urlOrRef);
    }

    /**
     * @type {!Firebase}
     * @private
     */
    this.ref_ = urlOrRef.ref(); // For queries, this gets the ref that is the basis for the query.

    /**
     * @type {!Firebase.Query}
     * @private
     */
    this.queryRef_ = urlOrRef; // For queries, this is the complete query, e.g. including the sortByChild etc.
};


/**
 * Firebase.authWithCustomToken() wrapped in a promise.
 * @see https://www.firebase.com/docs/web/api/firebase/authwithcustomtoken.html
 *
 * @param {string} authToken
 * @param {!Object=} opt_options
 * @return
    {
        !Promise<!Firebase.AuthCallbackData,!Error>
        |
        !goog.Promise<!Firebase.AuthCallbackData,!Error>
    } A promise which resolves to the authData, or is rejected with an error.
 * @export
 */
onfire.Ref.prototype.authWithCustomToken = function(authToken, opt_options) {

    return onfire.utils.firebase.authWithCustomToken(this.ref_, authToken, opt_options);
};


/**
 * Firebase.authAnonymously() wrapped in a promise.
 * @see https://www.firebase.com/docs/web/api/firebase/authanonymously.html
 *
 * @param {!Object=} opt_options
 * @return
    {
     !Promise<!Firebase.AuthCallbackData,!Error>
     |
     !goog.Promise<!Firebase.AuthCallbackData,!Error>
    } A promise which resolves to the authData, or is rejected with an error.
 * @export
 */
onfire.Ref.prototype.authAnonymously = function(opt_options) {

    return onfire.utils.firebase.authAnonymously(this.ref_, opt_options);
};


/**
 * Firebase.authWithPassword() wrapped in a promise.
 * @see https://www.firebase.com/docs/web/api/firebase/authwithpassword.html
 *
 * @param {!Firebase.AuthPasswordCredentials} credentials
 * @param {!Object=} opt_options
 * @return
    {
     !Promise<!Firebase.AuthCallbackData,!Error>
     |
     !goog.Promise<!Firebase.AuthCallbackData,!Error>
    } A promise which resolves to the authData, or is rejected with an error.
 * @export
 */
onfire.Ref.prototype.authWithPassword = function(credentials, opt_options) {

    return onfire.utils.firebase.authWithPassword(this.ref_, credentials, opt_options);
};


/**
 * Firebase.authWithOAuthPopup() wrapped in a promise.
 * @see https://www.firebase.com/docs/web/api/firebase/authwithoauthpopup.html
 *
 * @param {string} provider
 * @param {!Object=} opt_options
 * @return
    {
     !Promise<!Firebase.AuthCallbackData,!Error>
     |
     !goog.Promise<!Firebase.AuthCallbackData,!Error>
    } A promise which resolves to the authData, or is rejected with an error.
 * @export
 */
onfire.Ref.prototype.authWithOAuthPopup = function(provider, opt_options) {

    return onfire.utils.firebase.authWithOAuthPopup(this.ref_, provider, opt_options);
};


/**
 * Firebase.authWithOAuthRedirect() wrapped in a promise.
 * @see https://www.firebase.com/docs/web/api/firebase/authwithoauthredirect.html
 *
 * @param {string} provider
 * @param {!Object=} opt_options
 * @return {!Promise<null,!Error>|!goog.Promise<null,!Error>} A promise which is rejected with an
 *      error if the authentication fails.
 * @export
 */
onfire.Ref.prototype.authWithOAuthRedirect = function(provider, opt_options) {

    return onfire.utils.firebase.authWithOAuthRedirect(this.ref_, provider, opt_options);
};


/**
 * Firebase.authWithOAuthToken() wrapped in a promise.
 * @see https://www.firebase.com/docs/web/api/firebase/authwithoauthtoken.html
 *
 * @param {string} provider
 * @param {string|!Object} credentials
 * @param {!Object=} opt_options
 * @return
    {
     !Promise<!Firebase.AuthCallbackData,!Error>
     |
     !goog.Promise<!Firebase.AuthCallbackData,!Error>
    } A promise which resolves to the authData, or is rejected with an error.
 * @export
 */
onfire.Ref.prototype.authWithOAuthToken = function(provider, credentials, opt_options) {

    return onfire.utils.firebase.authWithOAuthToken(this.ref_, provider, credentials, opt_options);
};


/**
 * Firebase.changeEmail() wrapped in a promise.
 * @see https://www.firebase.com/docs/web/api/firebase/changeemail.html
 *
 * @param {!{oldEmail:string, password:string, newEmail:string}} credentials
 * @return {!Promise<null,!Error>|!goog.Promise<null,!Error>} A promise which resolves when the
 *      operation is complete, or is rejected with an error.
 * @export
 */
onfire.Ref.prototype.changeEmail = function(credentials) {

    return onfire.utils.firebase.changeEmail(this.ref_, credentials);
};


/**
 * Firebase.changePassword() wrapped in a promise.
 * @see https://www.firebase.com/docs/web/api/firebase/changepassword.html
 *
 * @param {!{email:string, oldPassword:string, newPassword:string}} credentials
 * @return {!Promise<null,!Error>|!goog.Promise<null,!Error>} A promise which resolves when the
 *      operation is complete, or is rejected with an error.
 * @export
 */
onfire.Ref.prototype.changePassword = function(credentials) {

    return onfire.utils.firebase.changePassword(this.ref_, credentials);
};


/**
 * Firebase.createUser() wrapped in a promise.
 * @see https://www.firebase.com/docs/web/api/firebase/createuser.html
 *
 * @param {!Firebase.AuthPasswordCredentials} credentials
 * @return {!Promise<!{uid:string},!Error>|!goog.Promise<!{uid:string},!Error>} A promise which
 *      resolves to a userData object, or is rejected with an error.
 * @export
 */
onfire.Ref.prototype.createUser = function(credentials) {

    return onfire.utils.firebase.createUser(this.ref_, credentials);
};


/**
 * A proxy for Firebase.getAuth().
 * @see https://www.firebase.com/docs/web/api/firebase/getauth.html
 *
 * @return {Firebase.AuthCallbackData}
 * @export
 */
onfire.Ref.prototype.getAuth = function() {

    return this.ref_.getAuth();
};


/**
 * A proxy for Firebase.goOnline().
 * @see https://www.firebase.com/docs/web/api/firebase/goonline.html
 *
 * @export
 */
onfire.Ref.prototype.goOnline = function() {

    this.ref_.goOnline();
};


/**
 * A proxy for Firebase.goOffline().
 * @see https://www.firebase.com/docs/web/api/firebase/gooffline.html
 *
 * @export
 */
onfire.Ref.prototype.goOffline = function() {

    this.ref_.goOffline();
};


/**
 * A proxy for Firebase.onAuth().
 * @see https://www.firebase.com/docs/web/api/firebase/onauth.html
 *
 * @param {!function(Firebase.AuthCallbackData)} onComplete
 * @param {!Object=} opt_context
 * @export
 */
onfire.Ref.prototype.onAuth = function(onComplete, opt_context) {

    this.ref_.onAuth(onComplete, opt_context);
};


/**
 * A proxy for Firebase.offAuth().
 * @see https://www.firebase.com/docs/web/api/firebase/offauth.html
 *
 * @param {!function(Firebase.AuthCallbackData)} onComplete
 * @param {!Object=} opt_context
 * @export
 */
onfire.Ref.prototype.offAuth = function(onComplete, opt_context) {

    this.ref_.offAuth(onComplete, opt_context);
};


/**
 * A proxy for Firebase.unauth().
 * @see https://www.firebase.com/docs/web/api/firebase/unauth.html
 *
 * @export
 */
onfire.Ref.prototype.unauth = function() {

    this.ref_.unauth();
};


/**
 * Returns a reference that is relative to the current location.
 * @see https://www.firebase.com/docs/web/api/firebase/child.html
 *
 * @param {string} childPath
 * @return {!onfire.Ref} A reference that is relative to the current location.
 * @export
 */
onfire.Ref.prototype.child = function(childPath) {

    var ref = this.ref_.child(childPath);
    return new onfire.Ref(ref);
};


/**
 * Generates a push ID. This takes the place of .push() when all we want is a unique ID, via a
 * synchronous method instead of a promise, which is what .push() returns.
 *
 * @return {string} A unique ID.
 * @export
 */
onfire.Ref.prototype.generateId = function() {

    return this.ref_.push().key();
};


/**
 * Returns the key of the current location.
 * @see https://www.firebase.com/docs/web/api/firebase/key.html
 *
 * @return {string} The key of the current location.
 * @export
 */
onfire.Ref.prototype.key = function() {

    return this.ref_.key();
};


/**
 * Deregisters a previously registered callback.
 * @see https://www.firebase.com/docs/web/api/query/off.html
 *
 * @param {onfire.utils.firebase.EventType=} opt_eventType
 * @param {!Firebase.EventCallback=} opt_callback If provided, this MUST be the *wrapped* callback
 *      returned by the .on() method.
 * @param {!Object=} opt_context
 * @export
 */
onfire.Ref.prototype.off = function(opt_eventType, opt_callback, opt_context) {

    this.queryRef_.off(opt_eventType, opt_callback); // Because we wrap all callbacks, there is no context.
};


/**
 * Deregisters a previously registered .onValue() callback.
 *
 * @param {!function(Firebase.Value)} callback This MUST be the *wrapped* callback returned
 *      by .onValue().
 * @param {!Object=} context
 * @export
 */
onfire.Ref.prototype.offValue = function(callback, context) {

    this.off(onfire.utils.firebase.EventType.VALUE, callback, context);
};


/**
 * Registers a callback for an event of a specified type at the current location. Make sure to keep
 * the return value for use when turning this off -- see the off() method.
 * @see https://www.firebase.com/docs/web/api/query/on.html
 *
 * @param {onfire.utils.firebase.EventType} eventType
 * @param {!Firebase.EventCallback} callback
 * @param {function(!Error)=} cancelCallback
 * @param {Object=} context
 * @return {!function(!Firebase.DataSnapshot, ?string=)} A handler function that may be needed when
 *      deregistering the callback.
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

    return this.queryRef_.on(eventType, cbWrapper, cancelWrapper);
};


/**
 * Waits for the first event of a specified type at the current location. A promisified analogue
 * of Firebase's .once() method.
 * @see https://www.firebase.com/docs/web/api/query/once.html
 *
 * @param {onfire.utils.firebase.EventType} eventType
 * @return {!Promise<!Firebase.DataSnapshot,!Error>|!goog.Promise<!Firebase.DataSnapshot,!Error>} A
 *      promise that resolves to a Firebase snapshot, or is rejected with an error.
 * @export
 */
onfire.Ref.prototype.once = function(eventType) {

    onfire.utils.logging.info('ONCE ' + eventType.toUpperCase() +  ' ' + this.path());

    var self = this;
    return onfire.utils.firebase.once(this.queryRef_, eventType).
        then(function(/** !Firebase.DataSnapshot */snapshot) {
            onfire.utils.logging.info('ONCE ' + eventType.toUpperCase() +  ' (Success) ' +
                self.path(), snapshot.val());
            return snapshot;
        }, function(/** !Error */err) {
            onfire.utils.logging.error('ONCE ' + eventType.toUpperCase() +  ' (Failure) ' +
                self.path(), err);
            throw err;
        });
};


/**
 * Retrieves the value that is stored at the current location. This is shorthand for calling .once()
 * for the 'value' event and then extracting the value of the returned snapshot.
 *
 * @return {!Promise<Firebase.Value,!Error>|!goog.Promise<Firebase.Value,!Error>} A promise that
 *      resolves to the value stored at the current location, or is rejected with an error.
 * @export
 */
onfire.Ref.prototype.onceValue = function() {

    return this.once(onfire.utils.firebase.EventType.VALUE).
        then(function(/** !Firebase.DataSnapshot */snapshot) {
            return snapshot.val();
        });
};


/**
 * Registers a callback for value changes at the current location. This is shorthand for calling
 * .on() for the 'value' event and then extracting the value of each returned snapshot. Make sure to
 * keep the return value for when you want to turn this off. See the .offValue() method.
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
 * Returns a reference to the parent of the current location.
 * @see https://www.firebase.com/docs/web/api/firebase/parent.html
 *
 * @return {onfire.Ref} A reference to the parent of the current location.
 * @export
 */
onfire.Ref.prototype.parent = function() {

    var parent = this.ref_.parent();
    return parent ? new onfire.Ref(parent) : null;
};


/**
 * Returns the path of this reference relative to the root, i.e. not including the firebaseio.com
 * domain.
 *
 * @return {string} The path of this reference relative to the root.
 * @export
 */
onfire.Ref.prototype.path = function() {

    // Only parse the path the first time, then re-use.
    return this.path_ ||
        (this.path_ = decodeURIComponent(goog.Uri.parse(this.ref_.toString()).getPath()) || '/');
};


/**
 * Pushes a value under the current location. A promisified analogue of Firebase's .push() method.
 * @see https://www.firebase.com/docs/web/api/firebase/push.html
 *
 * @param {Firebase.Value=} opt_value
 * @return {!Promise<!onfire.Ref,!Error>|!goog.Promise<!onfire.Ref,!Error>} A promise that resolves
 *      to the Ref of the newly pushed child.
 * @export
 */
onfire.Ref.prototype.push = function(opt_value) {

    onfire.utils.logging.info('PUSH ' + this.path() + ' :', opt_value);

    var self = this;
    return onfire.utils.firebase.push(this.ref_, opt_value).
        then(function(/** !Firebase */ref) {
            onfire.utils.logging.info('PUSH (Success) ' + self.path() + ' :', opt_value);
            return new onfire.Ref(ref);
        }, function(/** !Error */err) {
            onfire.utils.logging.error('PUSH (Failure) ' + self.path() + ' :', opt_value, err);
            throw err;
        });
};


/**
 * Returns an unwrapped Firebase reference to the current location.
 *
 * @return {!Firebase} An unwrapped Firebase reference to the current location.
 * @export
 */
onfire.Ref.prototype.ref = function() {

    return this.ref_;
};


/**
 * Removes the data that is stored at the current location. A promisified analogue of Firebase's
 * .remove() method.
 * @see https://www.firebase.com/docs/web/api/firebase/remove.html
 *
 * @return {!Promise<null,!Error>|!goog.Promise<null,!Error>} A promise that resolves when the
 *      operation is complete, or is rejected with an error.
 * @export
 */
onfire.Ref.prototype.remove = function() {

    onfire.utils.logging.info('REMOVE ' + this.path());

    var self = this;
    return onfire.utils.firebase.remove(this.ref_).
        then(function() {
            onfire.utils.logging.info('REMOVE (Success) ' + self.path());
            return null;
        }, function(/** !Error */err) {
            onfire.utils.logging.error('REMOVE (Failure) ' + self.path(), err);
            throw err;
        });
};


/**
 * Firebase.removeUser() wrapped in a promise.
 * @see https://www.firebase.com/docs/web/api/firebase/removeuser.html
 *
 * @param {!Firebase.AuthPasswordCredentials} credentials
 * @return {!Promise<null,!Error>|!goog.Promise<null,!Error>} A promise which resolves when the
 *      operation is complete, or is rejected with an error.
 * @export
 */
onfire.Ref.prototype.removeUser = function(credentials) {

    return onfire.utils.firebase.removeUser(this.ref_, credentials);
};


/**
 * Firebase.resetPassword() wrapped in a promise.
 * @see https://www.firebase.com/docs/web/api/firebase/resetpassword.html
 *
 * @param {!{email:string}} credentials
 * @return {!Promise<null,!Error>|!goog.Promise<null,!Error>} A promise which resolves when the
 *      operation is complete, or is rejected with an error.
 * @export
 */
onfire.Ref.prototype.resetPassword = function(credentials) {

    return onfire.utils.firebase.resetPassword(this.ref_, credentials);
};


/**
 * Returns a reference that represents the root of the tree.
 * @see https://www.firebase.com/docs/web/api/firebase/root.html
 *
 * @return {!onfire.Ref} A reference that represents the root of the tree.
 * @export
 */
onfire.Ref.prototype.root = function() {

    return new onfire.Ref(this.ref_.root());
};


/**
 * Stores a value at the current location. A promisified analogue of Firebase's .set() method.
 * @see https://www.firebase.com/docs/web/api/firebase/set.html
 *
 * @param {Firebase.Value} value
 * @return {!Promise<null,!Error>|!goog.Promise<null,!Error>} A promise that resolves when the
 *      operation is complete, or is rejected with an error.
 * @export
 */
onfire.Ref.prototype.set = function(value) {

    onfire.utils.logging.info('SET ' + this.path() + ' :', value);

    var self = this;
    return onfire.utils.firebase.set(this.ref_, value).
        then(function() {
            onfire.utils.logging.info('SET (Success) ' + self.path() + ' :', value);
            return null;
        }, function(/** !Error */err) {
            onfire.utils.logging.error('SET (Failure) ' + self.path() + ' :', value, err);
            throw err;
        });
};


/**
 * Sets a the values stored at the current location, atomically. A promisified analogue of
 * Firebase's .transaction() method.
 * @see https://www.firebase.com/docs/web/api/firebase/transaction.html
 *
 * @param {Firebase.TransactionUpdateFunction} updateFn
 * @return
    {
        !Promise<!{{isCommitted:boolean,snapshot:Firebase.DataSnapshot}},!Error>
        |
        !goog.Promise<!{{isCommitted:boolean,snapshot:Firebase.DataSnapshot}},!Error>
    } A promise that resolves when the operation is complete, or is rejected with an error. The
    value provided when the promise resolves is an object with two properties:
        isCommitted: whether the operation actually committed a value to the database.
        snapshot: a snapshot of the current data.
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
        }, function(/** !Error */err) {
            onfire.utils.logging.error('TRANSACTION Failed at ' + self.path());
            throw err;
        });
};


/**
 * Updates multiple key/value pairs stored at the current location. A promisified analogue of
 * Firebase's .update() method.
 * @see https://www.firebase.com/docs/web/api/firebase/update.html
 *
 * @param {!Object<string,Firebase.Value>} values An object containing the key/value pairs.
 * @return {!Promise<null,!Error>|goog.Promise<null,!Error>} A promise that resolves when the
 *      operation is complete, or is rejected with an error.
 * @export
 */
onfire.Ref.prototype.update = function(values) {

    onfire.utils.logging.info('UPDATE ' + this.path() + ' :', values);

    var self = this;
    return onfire.utils.firebase.update(this.ref_, values).
        then(function() {
            onfire.utils.logging.info('UPDATE (Success) ' + self.path() + ' :', values);
            return null;
        }, function(/** !Error */err) {
            onfire.utils.logging.error('UPDATE (Failure) ' + self.path() + ' :', values, err);
            throw err;
        });
};
