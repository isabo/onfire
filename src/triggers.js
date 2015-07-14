goog.provide('onfire.triggers');

goog.require('onfire.utils.firebase.EventType');
goog.require('onfire.utils.promise');
goog.require('onfire.utils.logging');


/**
 * We cannot require onfire.Model without causing a circular reference. This is the
 * relevant definition we need here:
 *
 * @typedef {{id: function():string}}
 */
var Model;


/**
 * @typedef {function(...?):(!Promise|!goog.Promise|undefined)}
 */
onfire.triggers.Handler;


/**
 * Framework for loose coupling of sequences of changes that must be made. A change made in one
 * structure by THIS client, may require changes in other places, e.g. indexes.
 *
 * @constructor
 */
onfire.triggers.Manager = function(){

    /**
     * Array of tuples, each consisting of a regular expression, and event type and a handler
     * function.
     *
     * @type {!Array<!Array<!RegExp|onfire.utils.firebase.EventType|!onfire.triggers.Handler|!Model>>}
     * @private
     */
    this.tuples_ = [];
};
goog.addSingletonGetter(onfire.triggers.Manager);



/**
 * Register a handler function to call when an event is reported at a reference that matches an
 * expression.
 *
 * @param {!RegExp} regexp An expression that matches references where we want to handle events.
 * @param {onfire.utils.firebase.EventType} eventType The Firebase event type to handle.
 * @param {!onfire.triggers.Handler} handler A function that will be called with all the
 *        RegExp extracted values as arguments, when a relevant event is reported at a relevant
 *         reference. Handler functions must throw errors or return rejected promises to indicate
 *        failure, or return nothing or a promise that resolves when the operation is complete.
 * @param {!Model} context The object that owns the handler, i.e. 'this'.
 */
onfire.triggers.Manager.prototype.register = function(regexp, eventType, handler, context){

    onfire.utils.logging.info('REGISTER_LOCAL_TRIGGER at ' + regexp.toString() + ' on ' +
        eventType.toUpperCase() + ' for ' + context.id());
    this.tuples_.push([regexp, eventType, handler, context]);
};


/**
 * Unregister all handles for a context i.e. a model instance.
 *
 * @param {!Model} context
 */
onfire.triggers.Manager.prototype.unregisterContext = function(context){

    onfire.utils.logging.info('UNREGISTER_LOCAL_TRIGGERS for ' + context.id());

    var i = this.tuples_.length;
    while (i--) {
        if (this.tuples_[i][3] === context) {
            var toRemove = this.tuples_[i];
            this.tuples_.splice(i, 1);
            onfire.utils.logging.info('UNREGISTER_LOCAL_TRIGGER (Success) at ' +
                toRemove[0].toString() + ' on ' + toRemove[1].toUpperCase() +' for ' +
                context.id());
        }
    }
};


/**
 * Report that an event has happened, sourced by this client. Returns a promise that resolves or
 * rejects when the operations are complete or at least one fails.
 *
 * @param {onfire.Ref} ref The reference where the event happened.
 * @param {onfire.utils.firebase.EventType} eventType The type of event.
 * @param {Firebase.Value|!Object} modelOrOldValue The previous value of a changed property or the
 *         added/removed model instance.
 * @param {Firebase.Value|!Model=} opt_newValue The current value of a changed property.
 * @return {!Promise<!Array,!Error>|!goog.Promise<!Array,!Error>}
 */
onfire.triggers.Manager.prototype.trigger = function(ref, eventType, modelOrOldValue,
        opt_newValue){

    if (ref === null) {
        return onfire.utils.promise.resolve([null]);
    }

    onfire.utils.logging.info('LOCAL_TRIGGER_GENERATED ' + eventType.toUpperCase() + ' at ' +
        ref.path());

    // Compare event then ref for every registered handler.
    var results = [];
    var path = ref.path();
    for (var i = 0; i < this.tuples_.length; i++) {
        var regexp = this.tuples_[i][0];
        var type = this.tuples_[i][1];
        var handler = this.tuples_[i][2];
        var context = this.tuples_[i][3];

        if (type === eventType) {
            var extracted = path.match(regexp);
            if (extracted) {
                onfire.utils.logging.info('LOCAL_TRIGGER_MATCHED at ' + regexp.toString() +
                    ' on ' + type.toUpperCase() + ' for ' + context.id());
                extracted.push(modelOrOldValue);
                if (eventType === onfire.utils.firebase.EventType.VALUE) {
                    extracted.push(opt_newValue);
                }
                try {
                    var result = handler.apply(context, extracted.slice(1));
                } catch(e) {
                    // There's a problem: abort.
                    onfire.utils.logging.info('LOCAL_TRIGGER_FAILED at ' + regexp.toString() + ' on ' +
                        type.toUpperCase(), e);
                    return onfire.utils.promise.reject(e);
                }
                results.push(result);
            }
        }
    }

    return onfire.utils.promise.all(results);
};


/**
 * Convenience method to register an event handler.
 *
 * @param {!RegExp} regexp An expression that matches references where we want to handle events.
 * @param {onfire.utils.firebase.EventType} eventType The Firebase event type to handle.
 * @param {!onfire.triggers.Handler} handler A function that will be called with all the
 *        RegExp extracted values as arguments, when a relevant event is reported at a relevant
 *         reference. Handler functions must throw errors or return rejected promises to indicate
 *        failure, or return nothing or a promise that resolves when the operation is complete.
 * @param {!Model} context The object that owns the handler, i.e. 'this'.
 */
onfire.triggers.register = function(regexp, eventType, handler, context){

    return onfire.triggers.Manager.getInstance().register(regexp, eventType, handler,
        context);
};


/**
 * Unregister all handles for a context i.e. a model instance.
 *
 * @param {!Model} context
 */
onfire.triggers.unregisterContext = function(context){

    onfire.triggers.Manager.getInstance().unregisterContext(context);
};


/**
 * Convenience method to trigger an event.
 *
 * @param {onfire.Ref} ref The reference where the event happened.
 * @param {onfire.utils.firebase.EventType} eventType The type of event.
 * @param {Firebase.Value|!Model} modelOrOldValue The previous value of a changed property or the
 *         added/removed model instance.
 * @param {Firebase.Value|!Model=} opt_newValue The current value of a changed property.
 * @return {!Promise<!Array,!Error>|!goog.Promise<!Array,!Error>}
 * @private
 */
onfire.triggers.trigger_ = function(ref, eventType, modelOrOldValue, opt_newValue){

    return onfire.triggers.Manager.getInstance().trigger(ref, eventType, modelOrOldValue,
        opt_newValue);
};


/**
 * Convenience method to trigger a CHILD_ADDED event.
 *
 * @param {onfire.Ref} ref The reference where the event happened.
 * @param {!Model|Firebase.Value} child The new child model instance or value.
 * @return {!Promise<!Array,!Error>|!goog.Promise<!Array,!Error>}
 */
onfire.triggers.triggerChildAdded = function(ref, child){

    return onfire.triggers.trigger_(ref, onfire.utils.firebase.EventType.CHILD_ADDED, child);
};


/**
 * Convenience method to trigger a CHILD_ADDED event.
 *
 * @param {onfire.Ref} ref The reference where the event happened.
 * @param {!Model|Firebase.Value} child The child model instance or value that was removed.
 * @return {!Promise<!Array,!Error>|!goog.Promise<!Array,!Error>}
 */
onfire.triggers.triggerChildRemoved = function(ref, child){

    return onfire.triggers.trigger_(ref, onfire.utils.firebase.EventType.CHILD_REMOVED, child);
};


/**
 * Convenience method to trigger a VALUE event.
 *
 * @param {!onfire.Ref} ref The reference whose value changed.
 * @param {Firebase.Value} oldValue The previous value at the reference.
 * @param {Firebase.Value} newValue The current value at the reference.
 * @return {!Promise<!Array,!Error>|!goog.Promise<!Array,!Error>}
 */
onfire.triggers.triggerValueChanged = function(ref, oldValue, newValue){

    return onfire.triggers.trigger_(ref, onfire.utils.firebase.EventType.VALUE, oldValue,
        newValue);
};
