// @ts-check
/// <reference path="../injectSourceCode.d.ts" />

import Module from 'module'
import nodeCrypto from 'crypto'

/**
 * @param {Object} params
 * @param {unknown} params.context
 * @param {Map<string, any>} [params.cache]
 * @param {Set<string>} [params.references]
 * @param {Record<string, any>} params.scopedContext
 * @param {string} params.sourceCode
 * @param {string} params.id
 * @returns {any}
 */
function requireWithFakeGlobalScope(params) {
  const getModuleCode = `(function(module,exports,require,globalThis,${Object.keys(
    params.scopedContext,
  ).join(',')}) {${params.sourceCode}\n})`
  const module = {
    exports: {},
    loaded: false,
    id: params.id,
  }

  // @ts-ignore
  const moduleRequire = (Module.createRequire || Module.createRequireFromPath)(
    __filename,
  )

  /** @param {string} pathToRequire */
  function throwingRequire(pathToRequire) {
    if (pathToRequire.startsWith('./')) {
      const moduleName = pathToRequire.replace(/^\.\//, '')
      if (!params.cache || !params.cache.has(moduleName)) {
        throw new Error(`Cannot find module '${moduleName}'`)
      }
      return params.cache.get(moduleName).exports
    }
    return moduleRequire(pathToRequire)
  }

  throwingRequire.resolve = moduleRequire.resolve.bind(moduleRequire)

  eval(getModuleCode)(
    module,
    module.exports,
    throwingRequire,
    params.context,
    ...Object.values(params.scopedContext),
  )

  return module.exports
}

/**
 * @returns {import('../../type-definitions/index')}
 * @param {Record<string, any>} [scopedContext]
 */
export function load(scopedContext = {}) {
  /** @type Record<string, any> */
  const context = {}
  assign(context, {
    TextDecoder,
    TextEncoder,
    TextEncoderStream,
    TextDecoderStream,
    atob,
    btoa,
    performance,
  })

  /** @type {import('../../type-definitions/console')} */
  const consoleImpl = requireWithFakeGlobalScope({
    context,
    id: 'console.js',
    sourceCode: injectSourceCode('./console.js'),
    scopedContext,
  })
  assign(context, { console: consoleImpl.console })

  /** @type {import('../../type-definitions/timers')} */
  const timersImpl = requireWithFakeGlobalScope({
    context,
    id: 'timers.js',
    sourceCode: injectSourceCode('./timers.js'),
    scopedContext,
  })
  assign(context, {
    setTimeout: timersImpl.setTimeout,
    setInterval: timersImpl.setInterval,
  })

  /** @type {import('../../type-definitions/events')} */
  const eventsImpl = requireWithFakeGlobalScope({
    context,
    id: 'events.js',
    sourceCode: injectSourceCode('./events.js'),
    scopedContext,
  })

  assign(context, {
    Event,
    EventTarget,
    FetchEvent: eventsImpl.FetchEvent,
    // @ts-expect-error we need to add this to the type definitions maybe
    PromiseRejectionEvent: eventsImpl.PromiseRejectionEvent,
  })

  assign(context, require('./stream'))

  /** @type {import('../../type-definitions/abort-controller')} */
  const abortControllerImpl = requireWithFakeGlobalScope({
    context,
    id: 'abort-controller.js',
    sourceCode: injectSourceCode('./abort-controller.js'),
    scopedContext: { ...scopedContext },
  })
  assign(context, {
    AbortController: abortControllerImpl.AbortController,
    AbortSignal: abortControllerImpl.AbortSignal,
    DOMException: abortControllerImpl.DOMException,
  })

  /** @type {import('../../type-definitions/url')} */
  const urlImpl = requireWithFakeGlobalScope({
    context,
    id: 'url.js',
    sourceCode: injectSourceCode('./url.js'),
    scopedContext: { ...scopedContext },
  })
  assign(context, {
    URL,
    URLSearchParams,
    URLPattern: urlImpl.URLPattern,
  })
  assign(context, { structuredClone })
  assign(context, require('./fetch.js'))
  assign(context, getCrypto(context, scopedContext))
  return context
}

/**
 * @returns {import('../../type-definitions/crypto')}
 */
function getCrypto(context, scopedContext) {
  /* it needs node19 to work */
  if (typeof SubtleCrypto !== 'undefined' || scopedContext.SubtleCrypto) {
    return {
      crypto: scopedContext.crypto || globalThis.crypto,
      Crypto: scopedContext.Crypto || globalThis.Crypto,
      CryptoKey: scopedContext.CryptoKey || globalThis.CryptoKey,
      SubtleCrypto: scopedContext.SubtleCrypto || globalThis.SubtleCrypto,
    }
  } else {
    /** @type {any} */
    const webcrypto = nodeCrypto.webcrypto
    return {
      crypto: webcrypto,
      Crypto: webcrypto.constructor,
      CryptoKey: webcrypto.CryptoKey,
      SubtleCrypto: webcrypto.subtle.constructor,
    }
  }
}

/**
 * @template {Record<never, never>} T
 * @template {object} U
 * @param {T} context
 * @param {U} additions
 * @returns {asserts context is T & U}
 */
function assign(context, additions) {
  Object.assign(context, additions)
}
