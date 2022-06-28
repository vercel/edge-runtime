/**
 * Undici requires the http module and specifically these two helpers that
 * are defined only for certain Node versions so we must polyfill for older
 * node versions.
 */
const http = require('http')

http.validateHeaderName = function validateHeaderName(name) {
  if (typeof name !== 'string' || !name) {
    const message = `Header name must be a valid HTTP token ["${name}"]`
    const error = new TypeError(message)
    error.code = 'ERR_INVALID_HTTP_TOKEN'
    throw error
  }
}

http.validateHeaderValue = function validateHeaderValue(value) {
  if (value === undefined) {
    const message = `Invalid value "${value}" for header "${value}"`
    const error = new TypeError(message)
    error.code = 'ERR_HTTP_INVALID_HEADER_VALUE'
    throw error
  }
}

module.exports = http
