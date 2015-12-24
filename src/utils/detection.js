/**
 * Detect platform-specific things.
 */


goog.provide('onfire.utils.detection');


/**
 * @type {boolean}
 */
onfire.utils.detection.IS_NODEJS =
    (typeof module !== 'undefined' && module !== this.module && !!module.exports);
