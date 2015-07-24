goog.provide('onfire');

goog.require('onfire.Ref');
goog.require('onfire.model.factory');
goog.require('onfire.model.Model');
goog.require('onfire.model.Collection');
goog.require('onfire.model.Error');
goog.require('onfire.utils.detection');


// Shorten the path to the model generation function.
goog.exportSymbol('onfire.defineModel', onfire.model.factory.defineModel);


if (onfire.utils.detection.IS_NODEJS) {
    module.exports = goog.global['onfire']; // That's where the compiler exported everything to.
}
