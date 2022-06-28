/**
 * The module util/types is missing in Node 12 so this module can be aliased
 * in ESBuild as a replacement for it.
 */
module.exports = require('util').types
