// @ts-check

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
    path: require.resolve('./console'),
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
    path: require.resolve('./text-encoding-streams'),
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
    path: require.resolve('./abort-controller'),
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
    path: require.resolve('./blob'),
    scopedContext: streamsImpl,
  })
  Object.assign(context, {
    Blob: blobImpl.Blob,
  })

  const structuredCloneImpl = requireWithFakeGlobalScope({
    path: require.resolve('./structured-clone'),
    context,
    scopedContext: streamsImpl,
  })
  Object.assign(context, {
    structuredClone: structuredCloneImpl.structuredClone,
  })

  const fetchImpl = requireWithFakeGlobalScope({
    context,
    path: require.resolve('./fetch'),
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

  const cryptoImpl = require('./crypto')
  Object.assign(context, {
    crypto: cryptoImpl.crypto,
    Crypto: cryptoImpl.Crypto,
    CryptoKey: cryptoImpl.CryptoKey,
    SubtleCrypto: cryptoImpl.SubtleCrypto,
  })

  return context
}

module.exports = load()

import { createRequireFromPath, createRequire as createRequireM } from 'module'
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
  const resolved = require.resolve(params.path)
  const getModuleCode = `(function(module,exports,require,__dirname,__filename,globalThis,${Object.keys(
    params.scopedContext
  ).join(',')}) {${readFileSync(resolved, 'utf-8')}\n})`
  const module = {
    exports: {},
    loaded: false,
    id: resolved,
  }

  const moduleRequire = (createRequireM || createRequireFromPath)(resolved)

  eval(getModuleCode)(
    module,
    module.exports,
    moduleRequire,
    dirname(resolved),
    resolved,
    params.context,
    ...Object.values(params.scopedContext)
  )

  return module.exports
}
