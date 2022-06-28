/**
 * This polyfill is required because we have dependencies that require Blob
 * from node's buffer which is define only for certain versions. This way
 * we make sure the Blob we use in the whole realm is always the same.
 */
const buffer = require('buffer')
buffer.Blob = require('formdata-node').Blob
module.exports = buffer
