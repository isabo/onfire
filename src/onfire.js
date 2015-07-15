goog.provide('onfire');

goog.require('onfire.Ref');
goog.require('onfire.model.generator');
goog.require('onfire.model.Model');
goog.require('onfire.model.Collection');
goog.require('onfire.utils.detection');


// Shorten the path to the model generation function.
goog.exportSymbol('onfire.generateConstructor', onfire.model.generator.generateConstructor);


if (onfire.utils.detection.IS_NODEJS) {
    module.exports = goog.global['onfire']; // That's where the compiler exported everything to.
}
