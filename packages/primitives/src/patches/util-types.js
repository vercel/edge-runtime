/**
 * With this patch we allow to use util/types in undici but resolve to the
 * correct backwards compat module.
 */
module.exports = require('util').types
