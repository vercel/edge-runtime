// @ts-check

const path = require('path')
const nodeCrypto = require('crypto')

function load() {
  /** @type {Record<string, any>} */
  const context = {}

  const encodingImpl = require('./encoding')
  Object.assign(context, {
    TextDecoder: encodingImpl.TextDecoder,
    TextEncoder: encodingImpl.TextEncoder,
    atob: encodingImpl.atob,
    btoa: encodingImpl.btoa,
  })

  const consoleImpl = requireWithFakeGlobalScope({
    context,
    path: path.resolve(__dirname, './console.js'),
    scopedContext: {},
  })
  Object.assign(context, { console: consoleImpl.console })

  const eventsImpl = require('./events')
  Object.assign(context, {
    Event: eventsImpl.Event,
    EventTarget: eventsImpl.EventTarget,
    FetchEvent: eventsImpl.FetchEvent,
    PromiseRejectionEvent: eventsImpl.PromiseRejectionEvent,
  })

  const streamsImpl = require('./streams')
  const textEncodingStreamImpl = requireWithFakeGlobalScope({
    context,
    path: path.resolve(__dirname, './text-encoding-streams.js'),
    scopedContext: streamsImpl,
  })

  Object.assign(context, {
    ReadableStream: streamsImpl.ReadableStream,
    ReadableStreamBYOBReader: streamsImpl.ReadableStreamBYOBReader,
    ReadableStreamDefaultReader: streamsImpl.ReadableStreamDefaultReader,
    TextDecoderStream: textEncodingStreamImpl.TextDecoderStream,
    TextEncoderStream: textEncodingStreamImpl.TextEncoderStream,
    TransformStream: streamsImpl.TransformStream,
    WritableStream: streamsImpl.WritableStream,
    WritableStreamDefaultWriter: streamsImpl.WritableStreamDefaultWriter,
  })

  const abortControllerImpl = requireWithFakeGlobalScope({
    context,
    path: path.resolve(__dirname, './abort-controller.js'),
    scopedContext: eventsImpl,
  })
  Object.assign(context, abortControllerImpl)

  const urlImpl = require('./url')
  Object.assign(context, {
    URL: urlImpl.URL,
    URLSearchParams: urlImpl.URLSearchParams,
    URLPattern: urlImpl.URLPattern,
  })

  const blobImpl = requireWithFakeGlobalScope({
    context,
    path: path.resolve(__dirname, './blob.js'),
    scopedContext: streamsImpl,
  })
  Object.assign(context, {
    Blob: blobImpl.Blob,
  })

  const structuredCloneImpl = requireWithFakeGlobalScope({
    path: path.resolve(__dirname, './structured-clone.js'),
    context,
    scopedContext: streamsImpl,
  })
  Object.assign(context, {
    structuredClone: structuredCloneImpl.structuredClone,
  })

  const fetchImpl = requireWithFakeGlobalScope({
    context,
    path: path.resolve(__dirname, './fetch.js'),
    cache: new Map([
      ['abort-controller', { exports: abortControllerImpl }],
      ['streams', { exports: streamsImpl }],
    ]),
    scopedContext: {
      ...streamsImpl,
      ...urlImpl,
      ...abortControllerImpl,
      ...eventsImpl,
      structuredClone: context.structuredClone,
    },
  })
  Object.assign(context, {
    fetch: fetchImpl.fetch,
    File: fetchImpl.File,
    FormData: fetchImpl.FormData,
    Headers: fetchImpl.Headers,
    Request: fetchImpl.Request,
    Response: fetchImpl.Response,
    WebSocket: fetchImpl.WebSocket,
  })

  if (typeof SubtleCrypto !== 'undefined') {
    Object.assign(context, {
      crypto: globalThis.crypto,
      Crypto: globalThis.Crypto,
      CryptoKey: globalThis.CryptoKey,
      SubtleCrypto: globalThis.SubtleCrypto,
    })
  // @ts-ignore
  } else if (nodeCrypto.webcrypto) {
    Object.assign(context, {
      // @ts-ignore
      crypto: nodeCrypto.webcrypto,
      // @ts-ignore
      Crypto: nodeCrypto.webcrypto.constructor,
      // @ts-ignore
      CryptoKey: nodeCrypto.webcrypto.CryptoKey,
      // @ts-ignore
      SubtleCrypto: nodeCrypto.webcrypto.subtle.constructor,
    })
  } else {
    const cryptoImpl = require('./crypto')
    Object.assign(context, {
      crypto: cryptoImpl.crypto,
      Crypto: cryptoImpl.Crypto,
      CryptoKey: cryptoImpl.CryptoKey,
      SubtleCrypto: cryptoImpl.SubtleCrypto,
    })
  }

  return context
}

module.exports = load()

import Module from 'module'
import { dirname } from 'path'
import { readFileSync } from 'fs'

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
  const resolved = path.resolve(params.path)
  const getModuleCode = `(function(module,exports,require,__dirname,__filename,globalThis,${Object.keys(
    params.scopedContext
  ).join(',')}) {${readFileSync(resolved, 'utf-8')}\n})`
  const module = {
    exports: {},
    loaded: false,
    id: resolved,
  }

  const moduleRequire = (Module.createRequire || Module.createRequireFromPath)(
    resolved
  )

  function throwingRequire(path) {
    if (path.startsWith('./')) {
      const moduleName = path.replace(/^\.\//, '')
      if (!params.cache || !params.cache.has(moduleName)) {
        throw new Error(`Cannot find module '${moduleName}'`)
      }
      return params.cache.get(moduleName).exports
    }
    return moduleRequire(path)
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
