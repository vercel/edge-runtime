'use strict'

import { File } from 'node:buffer'
import undici from 'undici'

import {
  fromInnerResponse,
  makeNetworkError,
} from 'undici/lib/web/fetch/response'

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

const { Headers, FormData, WebSocket } = undici
const { Blob } = globalThis

export { fetch }
export { Blob }
export { Response }
export { File }
export { Request }
export { FormData }
export { Headers }
export { WebSocket }
