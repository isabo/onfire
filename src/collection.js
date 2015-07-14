goog.provide('onfire.Collection');

goog.require('onfire.Model');
goog.require('onfire.triggers');
goog.require('onfire.utils.promise');
goog.require('goog.object');


/**
 * Base class for collections (object maps) that live in Firebase.
 *
 * @param {!onfire.Ref} ref The reference of the current object.
 * @param {!function(new:onfire.Model, !onfire.Ref, number=)=} opt_memberCtor The constructor to
 *      use for instances of collection members.
 * @constructor
 * @extends {onfire.Model}
 * @template T
 * @export
 */
onfire.Collection = function(ref, opt_memberCtor){

    onfire.Collection.base(this, 'constructor', ref);

    /**
     * Any members should be instantiated with this constructor.
     *
     * @type {!function(new:onfire.Model, !onfire.Ref, number=)}
     * @private
     */
    this.memberCtor_ = opt_memberCtor || onfire.Model;
};
goog.inherits(onfire.Collection, onfire.Model);


/**
 * @override the return type.
 * @return {!Promise<!onfire.Collection,!Error>|!goog.Promise<!onfire.Collection,!Error>}
 */
onfire.Collection.prototype.whenLoaded;


// TODO: should we change the visibility of this to protected?
/**
 * @override the return type.
 * @param {string} propertyName The name of a property.
 * @param {Firebase.Value} value The primitive value to assign to the property.
 * @return {!onfire.Collection}
 */
onfire.Collection.prototype.set;


// TODO: should we change the visibility of this to protected?
/**
 * @override the return type.
 * @return {!onfire.Collection}
 */
onfire.Collection.prototype.save;


// TODO: should we change the visibility of this to protected?
/**
 * @override the return type.
 * @param {!Object<string,Firebase.Value>} pairs An object containing the property/value pairs to
 *        update.
 * @return {!onfire.Collection}
 * @protected
 */
onfire.Collection.prototype.update;


/**
 * Instantiate a specified item.
 *
 * @param {string} id The ID of the member.
 * @return {!Promise<!T,!Error>|!goog.Promise<!T,!Error>}
 * @export
 */
onfire.Collection.prototype.fetchItem = function(id){

    var item = new this.memberCtor_(this.ref.child(id));
    return item.whenLoaded();
};


/**
 * Instantiate a new, empty item, which, when written to, will become a member of the collection.
 *
 * @param {!Object<string,Firebase.Value>=} opt_values An object containing the property/value pairs
 *        to set.
 * @return {!Promise<!T,!Error>|!goog.Promise<!T,!Error>}
 * @export
 */
onfire.Collection.prototype.createItem = function (opt_values) {

    var id = this.ref.generateId();
    var p = this.fetchItem(id);
    if (opt_values) {
        p = p.then(function (/** !onfire.Model */item) {
            return item.update(/** @type {!Object<string,Firebase.Value>} */(opt_values));
        });
    }

    return p;
};


/**
 * Fetch an item by its ID, or create it if it does not yet exist, and use the provided ID.
 *
 * @param {string} id
 * @param {Object} values A set of property/value pairs to assign if created. If null, don't set
 *      any values. The object will come into existence only when a value is set.
 * @return {!Promise<!T,!Error>|!goog.Promise<!T,!Error>}
 * @export
 */
onfire.Collection.prototype.fetchOrCreateItem = function(id, values){

    return this.fetchItem(id).
        then(function(/** !onfire.Model */item){

            if (values) {

                return item.initializeValues(values).
                    then(function(){
                        return item;
                    });

            } else {
                return item;
            }
        });
};


/**
 * Remove the specified member of the collection.
 *
 * @param {string} id The ID of the member.
 * @return {!Promise|!goog.Promise}
 * @export
 */
onfire.Collection.prototype.removeItem = function(id){

    var removed;
    var self = this;
    return this.fetchItem(id).
        then(function(item){
            removed = item;
        }).
        then(function(){
            return self.set(id, null);
        }).
        then(function(){
            return onfire.triggers.triggerChildRemoved(self.ref, removed);
        }).
        then(function(){
            removed.dispose();
        });
};


/**
 * Perform an operation on each member of the collection.
 *
 * @param {!function(!onfire.Model, string=):(!Promise|!goog.Promise|undefined)} callback
 * @return {(!Promise|!goog.Promise)}
 * @export
 */
onfire.Collection.prototype.forEach = function(callback){

    var promises = [];
    for (var id in this.storageObj) {

        var p = this.fetchItem(id).
            then(function (item) {
                return callback.call(null, item, id);
            });
        promises.push(p);
    }

    return onfire.utils.promise.all(promises);
};


/**
 * Return the number of values.
 *
 * @return {number}
 * @export
 */
onfire.Collection.prototype.count = function(){

    return this.childrenCount;
};


/**
 * Return an array of the IDs of items in the collection.
 *
 * @return {!Array<string>}
 * @export
 */
onfire.Collection.prototype.ids = function(){

    return goog.object.getKeys(this.storageObj);
};


/**
 * Add a property/value pair.
 *
 * @param {!Firebase.DataSnapshot} snapshot
 * @private
 */
onfire.Collection.prototype.handleChildAdded_ = function(snapshot){

    if (!this.storageObj) {
        this.storageObj = {};
    }

    this.storageObj[snapshot.key()] = snapshot.val();
    this.childrenCount++;
};


/**
 * Remove a property/value pair.
 *
 * @param {!Firebase.DataSnapshot} snapshot
 * @private
 */
onfire.Collection.prototype.handleChildRemoved_ = function(snapshot){

    delete this.storageObj[snapshot.key()];

    if (goog.object.getKeys(this.storageObj).length === 0) {
        this.storageObj = null;
    }

    this.childrenCount--;
};
