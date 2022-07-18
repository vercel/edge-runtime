/**
 * Buffer should always have Blob and there are node versions that are missing
 * its implementation so instead we add our polyfill. ESBuild will replace the
 * dependency.
 */
module.exports = require('buffer')
module.exports.Blob = require('../primitives/blob').Blob
