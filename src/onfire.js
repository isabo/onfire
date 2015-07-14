goog.provide('onfire');

goog.require('onfire.Ref');
goog.require('onfire.Model');
goog.require('onfire.Collection');
goog.require('onfire.utils.detection');
goog.require('onfire.modelling');


if (onfire.utils.detection.IS_NODEJS) {
    module.exports = {
        'Ref': onfire.Ref,
        'Model': onfire.Model,
        'Collection': onfire.Collection,
        'modelling': {'generateConstructor': onfire.modelling.generateConstructor}
    };
}
