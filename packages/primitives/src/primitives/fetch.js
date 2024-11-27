'use strict'

const { File } = require('node:buffer')
const undici = require('undici')

const {
  fromInnerResponse,
  makeNetworkError,
} = require('undici/lib/web/fetch/response')

/**
 * Add `duplex: 'half'` by default to all requests
 */
function addDuplexToInit(options) {
  return typeof options === 'undefined' ||
    (typeof options === 'object' && options.duplex === undefined)
    ? { duplex: 'half', ...options }
    : options
}

/**
 * Add `duplex: 'half'` by default to all requests
 */
class Request extends undici.Request {
  constructor(input, options) {
    super(input, addDuplexToInit(options))
  }
}

/**
 * Make the Response headers object mutable
 * Check https://github.com/nodejs/undici/blob/1cfe0949053aac6267f11b919cee9315a27f1fd6/lib/web/fetch/response.js#L41
 */
const Response = undici.Response
Response.error = function () {
  return fromInnerResponse(makeNetworkError(), '')
}

/**
 * Add `duplex: 'half'` by default to all requests
 * Recreate the Response object with the undici Response object to allow mutable headers
 */
async function fetch(resource, options) {
  const res = await undici.fetch(resource, addDuplexToInit(options))
  const response = new Response(res.body, res)
  Object.defineProperty(response, 'url', { value: res.url })
  return response
}

module.exports = {
  fetch,
  Blob,
  Response,
  File,
  Request,
  FormData: undici.FormData,
  Headers: undici.Headers,
  WebSocket: undici.WebSocket,
}
