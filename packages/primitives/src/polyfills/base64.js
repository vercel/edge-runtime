/**
 * Defines Base64 Polyfills. These have to be evaluated in a Node Realm since
 * it requires Buffer to exist in the global scope.
 */
module.exports.atob = (enc) => Buffer.from(enc, 'base64').toString('binary')
module.exports.btoa = (str) => Buffer.from(str, 'binary').toString('base64')
