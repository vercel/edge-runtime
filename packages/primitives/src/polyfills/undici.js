/**
 * Undici expects some some globals defined at Node.js global level. We must
 * define them as they are missing in older versions. These are defined here
 * because it is just Undici who requires them.
 */
const abort = require('abort-controller')

/**
 * @see https://fetch.spec.whatwg.org/#concept-header-value-normalize
 * @param {string} potentialValue
 */
function headerValueNormalize(potentialValue) {
  //  To normalize a byte sequence potentialValue, remove
  //  any leading and trailing HTTP whitespace bytes from
  //  potentialValue.
  return potentialValue.replace(/^[\r\n\t ]+|[\r\n\t ]+$/g, '')
}

global.AbortController = abort.AbortController
global.AbortSignal = abort.AbortSignal

global.FinalizationRegistry = function () {
  return {
    register: function () {},
  }
}

const Constants = require('undici/lib/fetch/constants')
const CoreSymbols = require('undici/lib/core/symbols')

/**
 * We patch this constant to allow for Response to set Cookies. Originally
 * undici does not allow it as per spec, but we need to use the runtime for
 * server code it should be allowed.
 */
Constants.forbiddenResponseHeaderNames = []
Constants.forbiddenHeaderNames = []

const fetchImpl = require('undici/lib/fetch')
const Agent = require('undici/lib/agent')

/**
 * A global agent to be used with every fetch request. We also define a
 * couple of globals that we can hide in the runtime for advanced use.
 */
let globalDispatcher = new Agent()

function getGlobalDispatcher() {
  return globalDispatcher
}

function setGlobalDispatcher(agent) {
  if (!agent || typeof agent.dispatch !== 'function') {
    throw new InvalidArgumentError('Argument agent must implement Agent')
  }
  globalDispatcher = agent
}

const HeadersModule = require('undici/lib/fetch/headers')
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

  const _name = name.toLowerCase()
  if (_name === 'set-cookie') {
    this[SCookies].push(headerValueNormalize(value))
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

  const _name = name.toLowerCase()
  if (_name === 'set-cookie') {
    this[SCookies] = [headerValueNormalize(value)]
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

  const _name = name.toLowerCase()
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
  const _name = name.toLowerCase()
  if (_name !== 'set-cookie') {
    throw new Error(`getAll can only be used with 'set-cookie'`)
  }

  return this[CoreSymbols.kHeadersList][SCookies] || []
}

/**
 * Export updated Header Primitive
 */
module.exports.Headers = HeadersModule.Headers

const ResponseModule = require('undici/lib/fetch/response')
const FetchSymbols = require('undici/lib/fetch/symbols')

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

module.exports.Response = ResponseModule.Response

/**
 * Export fetch with an implementation that uses a default global dispatcher.
 * It also re-cretates a new Response object in order to allow mutations on
 * the Response headers.
 */
module.exports.fetch = async function fetch() {
  const res = await fetchImpl.apply(getGlobalDispatcher(), arguments)
  const response = new ResponseModule.Response(res.body, res)
  Object.defineProperty(response, 'url', { value: res.url })
  return response
}

/**
 * Assign remaining primitives.
 */
module.exports.Request = require('undici/lib/fetch/request').Request
module.exports.FormData = require('undici/lib/fetch/formdata').FormData
module.exports.File = require('undici/lib/fetch/file').File

/**
 * Export a getter and setter to be hidden to get and replace the agent.
 */
module.exports.getGlobalDispatcher = getGlobalDispatcher
module.exports.setGlobalDispatcher = setGlobalDispatcher
