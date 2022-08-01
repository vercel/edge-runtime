import { AbortController } from './abort-controller'
import { AbortSignal } from './abort-controller'

import * as CoreSymbols from 'undici/lib/core/symbols'
import * as FetchSymbols from 'undici/lib/fetch/symbols'
import * as HeadersModule from 'undici/lib/fetch/headers'
import * as ResponseModule from 'undici/lib/fetch/response'

import fetchImpl from 'undici/lib/fetch'
import Agent from 'undici/lib/agent'

global.AbortController = AbortController
global.AbortSignal = AbortSignal

// undici uses `process.nextTick`,
// but process APIs doesn't exist in a runtime context.
process.nextTick = setImmediate

/**
 * A symbol used to store cookies in the headers module.
 */
const SCookies = Symbol('set-cookie')

/**
 * Patch HeadersList.append so that when a `set-cookie` header is appended
 * we keep it in an list to allow future retrieval of all values.
 */
const __append = HeadersModule.HeadersList.prototype.append
HeadersModule.HeadersList.prototype.append = function (name, value) {
  const result = __append.call(this, name, value)
  if (!this[SCookies]) {
    Object.defineProperty(this, SCookies, {
      configurable: false,
      enumerable: false,
      writable: true,
      value: [],
    })
  }

  const _name = HeadersModule.normalizeAndValidateHeaderName(name)
  if (_name === 'set-cookie') {
    this[SCookies].push(
      HeadersModule.normalizeAndValidateHeaderValue(_name, value)
    )
  }

  return result
}

/**
 * Patch HeadersList.set to make sure that when a new value for `set-cookie`
 * is set it will also entirely replace the internal list of values.
 */
const __set = HeadersModule.HeadersList.prototype.set
HeadersModule.HeadersList.prototype.set = function (name, value) {
  const result = __set.call(this, name, value)
  if (!this[SCookies]) {
    Object.defineProperty(this, SCookies, {
      configurable: false,
      enumerable: false,
      writable: true,
      value: [],
    })
  }

  const _name = HeadersModule.normalizeAndValidateHeaderName(name)
  if (_name === 'set-cookie') {
    this[SCookies] = [
      HeadersModule.normalizeAndValidateHeaderValue(_name, value),
    ]
  }

  return result
}

/**
 * Patch HeaderList.delete to make sure that when `set-cookie` is cleared
 * we also remove the internal list values.
 */
const __delete = HeadersModule.HeadersList.prototype.delete
HeadersModule.HeadersList.prototype.delete = function (name) {
  __delete.call(this, name)
  if (!this[SCookies]) {
    Object.defineProperty(this, SCookies, {
      configurable: false,
      enumerable: false,
      writable: true,
      value: [],
    })
  }

  const _name = HeadersModule.normalizeAndValidateHeaderName(name)
  if (_name === 'set-cookie') {
    this[SCookies] = []
  }
}

/**
 * Add a new method for retrieving all independent `set-cookie` headers that
 * maybe have been appended. This will only work when getting `set-cookie`
 * headers.
 */
HeadersModule.Headers.prototype.getAll = function (name) {
  const _name = HeadersModule.normalizeAndValidateHeaderName(name)
  if (_name !== 'set-cookie') {
    throw new Error(`getAll can only be used with 'set-cookie'`)
  }

  return this[CoreSymbols.kHeadersList][SCookies] || []
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
 * Export fetch with an implementation that uses a default global dispatcher.
 * It also re-cretates a new Response object in order to allow mutations on
 * the Response headers.
 */
export async function fetch() {
  const res = await fetchImpl.apply(getGlobalDispatcher(), arguments)
  const response = new Response(res.body, res)
  Object.defineProperty(response, 'url', { value: res.url })
  return response
}

export const Headers = HeadersModule.Headers
export const Response = ResponseModule.Response

export { FormData } from 'undici/lib/fetch/formdata'
export { Request } from 'undici/lib/fetch/request'
export { File } from 'undici/lib/fetch/file'
