import * as FetchSymbols from 'undici/lib/fetch/symbols'
import * as HeadersModule from 'undici/lib/fetch/headers'
import * as ResponseModule from 'undici/lib/fetch/response'
import { Request as BaseRequest } from 'undici/lib/fetch/request'

import { fetch as fetchImpl } from 'undici/lib/fetch'
import Agent from 'undici/lib/agent'

// undici uses `process.nextTick`,
// but process APIs doesn't exist in a runtime context.
process.nextTick = setImmediate
process.emitWarning = () => {}

class Request extends BaseRequest {
  constructor(input, init) {
    super(input, addDuplexToInit(init))
  }
}

const __entries = HeadersModule.Headers.prototype.entries
HeadersModule.Headers.prototype.entries = function* () {
  let sentSetCookie = false
  for (const [key, value] of __entries.call(this)) {
    if (key === 'set-cookie') {
      if (sentSetCookie) {
        continue
      }
      sentSetCookie = true
      const cookies = this.getSetCookie()
      yield [key, cookies.join(', ')]
    } else {
      yield [key, value]
    }
  }
}

HeadersModule.Headers.prototype[Symbol.iterator] =
  HeadersModule.Headers.prototype.entries

HeadersModule.Headers.prototype.values = function* () {
  for (const [, value] of __entries.call(this)) {
    yield value
  }
}

/**
 * Method for retrieving all independent `set-cookie` headers that
 * may have been appended. This will only work when getting `set-cookie`
 * headers.
 *
 * @deprecated Use [`.getSetCookie()`](https://developer.mozilla.org/en-US/docs/Web/API/Headers/getSetCookie) instead.
 */
HeadersModule.Headers.prototype.getAll = function (name) {
  const _name = normalizeAndValidateHeaderName(name, 'Headers.getAll')
  if (_name !== 'set-cookie') {
    throw new Error(`getAll can only be used with 'set-cookie'`)
  }

  return this.getSetCookie()
}

/**
 * We also must patch the error static method since it works just like
 * redirect and we need consistency.
 */
const __error = ResponseModule.Response.error
ResponseModule.Response.error = function (...args) {
  const response = __error.call(this, ...args)
  response[FetchSymbols.kHeaders][FetchSymbols.kGuard] = 'response'
  return response
}

/**
 * normalize header name per WHATWG spec, and validate
 *
 * @param {string} potentialName
 * @param {'Header.append' | 'Headers.delete' | 'Headers.get' | 'Headers.has' | 'Header.set'} errorPrefix
 */
function normalizeAndValidateHeaderName(potentialName, errorPrefix) {
  const normalizedName = potentialName.toLowerCase()

  if (UtilModule.isValidHeaderName(normalizedName)) {
    return normalizedName
  }

  // Generate an WHATWG fetch spec compliant error
  WebIDLModule.errors.invalidArgument({
    prefix: errorPrefix,
    value: normalizedName,
    type: 'header name',
  })
}

/**
 * A global agent to be used with every fetch request. We also define a
 * couple of globals that we can hide in the runtime for advanced use.
 */
let globalDispatcher = new Agent()

export function getGlobalDispatcher() {
  return globalDispatcher
}

export function setGlobalDispatcher(agent) {
  if (!agent || typeof agent.dispatch !== 'function') {
    throw new InvalidArgumentError('Argument agent must implement Agent')
  }
  globalDispatcher = agent
}

/**
 * Add `duplex: 'half'` by default to all requests
 */
function addDuplexToInit(init) {
  return typeof init === 'undefined' ||
    (typeof init === 'object' && init.duplex === undefined)
    ? { duplex: 'half', ...init }
    : init
}

/**
 * Export fetch with an implementation that uses a default global dispatcher.
 * It also re-cretates a new Response object in order to allow mutations on
 * the Response headers.
 */
export async function fetch(info, init) {
  init = addDuplexToInit(init)
  const res = await fetchImpl.call(getGlobalDispatcher(), info, init)
  const response = new Response(res.body, res)
  Object.defineProperty(response, 'url', { value: res.url })
  return response
}

export const Headers = HeadersModule.Headers
export const Response = ResponseModule.Response

export { FormData } from 'undici/lib/fetch/formdata'
export { File } from 'undici/lib/fetch/file'
export { WebSocket } from 'undici/lib/websocket/websocket'
export { Request }
