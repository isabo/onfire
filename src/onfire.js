goog.provide('onfire');

goog.require('onfire.Ref');
goog.require('onfire.utils.detection');


if (onfire.utils.detection.IS_NODEJS) {
    module.exports = {
        'Ref': onfire.Ref
    };
}
