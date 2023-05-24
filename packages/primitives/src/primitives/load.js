// @ts-check

import Module from 'module'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import nodeCrypto from 'crypto'

/**
 * @param {Object} params
 * @param {unknown} params.context
 * @param {Map<string, any>} [params.cache]
 * @param {string} params.path
 * @param {Set<string>} [params.references]
 * @param {Record<string, any>} params.scopedContext
 * @returns {any}
 */
function requireWithFakeGlobalScope(params) {
  const resolved = params.path
  const getModuleCode = `(function(module,exports,require,__dirname,__filename,globalThis,${Object.keys(
    params.scopedContext
  ).join(',')}) {${readFileSync(resolved, 'utf-8')}\n})`
  const module = {
    exports: {},
    loaded: false,
    id: resolved,
  }

  // @ts-ignore
  const moduleRequire = (Module.createRequire || Module.createRequireFromPath)(
    resolved
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
    dirname(resolved),
    resolved,
    params.context,
    ...Object.values(params.scopedContext)
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
  /** @type {import('../../type-definitions/encoding')} */
  const encodingImpl = requireWithFakeGlobalScope({
    context,
    path: join(__dirname, './encoding.js'),
    scopedContext: scopedContext,
  })
  assign(context, {
    TextDecoder: encodingImpl.TextDecoder,
    TextEncoder: encodingImpl.TextEncoder,
    atob: encodingImpl.atob,
    btoa: encodingImpl.btoa,
  })

  /** @type {import('../../type-definitions/console')} */
  const consoleImpl = requireWithFakeGlobalScope({
    context,
    path: join(__dirname, './console.js'),
    scopedContext: scopedContext,
  })
  assign(context, { console: consoleImpl.console })

  /** @type {import('../../type-definitions/events')} */
  const eventsImpl = requireWithFakeGlobalScope({
    context,
    path: join(__dirname, './events.js'),
    scopedContext: scopedContext,
  })
  assign(context, {
    Event: eventsImpl.Event,
    EventTarget: eventsImpl.EventTarget,
    FetchEvent: eventsImpl.FetchEvent,
    // @ts-expect-error we need to add this to the type definitions maybe
    PromiseRejectionEvent: eventsImpl.PromiseRejectionEvent,
  })

  /** @type {import('../../type-definitions/streams')} */
  const streamsImpl = requireWithFakeGlobalScope({
    context,
    path: join(__dirname, './streams.js'),
    scopedContext: { ...scopedContext },
  })

  /** @type {import('../../type-definitions/text-encoding-streams')} */
  const textEncodingStreamImpl = requireWithFakeGlobalScope({
    context,
    path: join(__dirname, './text-encoding-streams.js'),
    scopedContext: { ...streamsImpl, ...scopedContext },
  })

  assign(context, {
    ReadableStream: streamsImpl.ReadableStream,
    ReadableStreamBYOBReader: streamsImpl.ReadableStreamBYOBReader,
    ReadableStreamDefaultReader: streamsImpl.ReadableStreamDefaultReader,
    TextDecoderStream: textEncodingStreamImpl.TextDecoderStream,
    TextEncoderStream: textEncodingStreamImpl.TextEncoderStream,
    TransformStream: streamsImpl.TransformStream,
    WritableStream: streamsImpl.WritableStream,
    WritableStreamDefaultWriter: streamsImpl.WritableStreamDefaultWriter,
  })

  /** @type {import('../../type-definitions/abort-controller')} */
  const abortControllerImpl = requireWithFakeGlobalScope({
    context,
    path: join(__dirname, './abort-controller.js'),
    scopedContext: { ...eventsImpl, ...scopedContext },
  })
  assign(context, {
    AbortController: abortControllerImpl.AbortController,
    AbortSignal: abortControllerImpl.AbortSignal,
    DOMException: abortControllerImpl.DOMException,
  })

  /** @type {import('../../type-definitions/url')} */
  const urlImpl = requireWithFakeGlobalScope({
    context,
    path: join(__dirname, './url.js'),
    scopedContext: { ...scopedContext },
  })
  assign(context, {
    URL: urlImpl.URL,
    URLSearchParams: urlImpl.URLSearchParams,
    URLPattern: urlImpl.URLPattern,
  })

  /** @type {import('../../type-definitions/blob')} */
  const blobImpl = requireWithFakeGlobalScope({
    context,
    path: join(__dirname, './blob.js'),
    scopedContext: { ...streamsImpl, ...scopedContext },
  })
  assign(context, {
    Blob: blobImpl.Blob,
  })

  /** @type {import('../../type-definitions/structured-clone')} */
  const structuredCloneImpl = requireWithFakeGlobalScope({
    path: join(__dirname, './structured-clone.js'),
    context,
    scopedContext: { ...streamsImpl, ...scopedContext },
  })
  assign(context, {
    structuredClone: structuredCloneImpl.structuredClone,
  })

  /** @type {import('../../type-definitions/fetch')} */
  const fetchImpl = requireWithFakeGlobalScope({
    context,
    path: join(__dirname, './fetch.js'),
    cache: new Map([
      ['abort-controller', { exports: abortControllerImpl }],
      ['streams', { exports: streamsImpl }],
    ]),
    scopedContext: {
      global: { ...scopedContext },
      ...scopedContext,
      ...streamsImpl,
      ...urlImpl,
      ...abortControllerImpl,
      ...eventsImpl,
      structuredClone: context.structuredClone,
    },
  })
  assign(context, {
    fetch: fetchImpl.fetch,
    File: fetchImpl.File,
    FormData: fetchImpl.FormData,
    Headers: fetchImpl.Headers,
    Request: fetchImpl.Request,
    Response: fetchImpl.Response,
    WebSocket: fetchImpl.WebSocket,
  })

  const cryptoImpl = getCrypto(context, scopedContext)
  assign(context, {
    crypto: cryptoImpl.crypto,
    Crypto: cryptoImpl.Crypto,
    CryptoKey: cryptoImpl.CryptoKey,
    SubtleCrypto: cryptoImpl.SubtleCrypto,
  })

  return context
}

/**
 * @returns {import('../../type-definitions/crypto')}
 */
function getCrypto(context, scopedContext) {
  if (typeof SubtleCrypto !== 'undefined' || scopedContext.SubtleCrypto) {
    return {
      crypto: scopedContext.crypto || globalThis.crypto,
      Crypto: scopedContext.Crypto || globalThis.Crypto,
      CryptoKey: scopedContext.CryptoKey || globalThis.CryptoKey,
      SubtleCrypto: scopedContext.SubtleCrypto || globalThis.SubtleCrypto,
    }
  } else if (nodeCrypto.webcrypto) {
    // @ts-ignore
    /** @type {any} */
    const webcrypto = nodeCrypto.webcrypto
    return {
      crypto: webcrypto,
      Crypto: webcrypto.constructor,
      CryptoKey: webcrypto.CryptoKey,
      SubtleCrypto: webcrypto.subtle.constructor,
    }
  }

  return requireWithFakeGlobalScope({
    context,
    path: join(__dirname, './crypto.js'),
    scopedContext: {
      ...scopedContext,
    },
  })
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
