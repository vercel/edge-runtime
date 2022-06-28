const { defineEnumerableProperties } = require('./utils')

export function addPrimitives(context) {
  defineEnumerableProperties(context, {
    globalThis: context,
    self: context,
  })

  const abort = require('abort-controller')
  defineEnumerableProperties(context, {
    AbortController: abort.AbortController,
    AbortSignal: abort.AbortSignal,
  })

  const { default: aggregate } = require('aggregate-error-ponyfill')
  defineEnumerableProperties(context, {
    AggregateError: aggregate,
  })

  const base64 = require('./polyfills/base64')
  defineEnumerableProperties(context, {
    atob: base64.atob,
    btoa: base64.btoa,
  })

  const buffer = require('./polyfills/buffer')
  defineEnumerableProperties(context, {
    Blob: buffer.Blob,
  })

  const webCrypto = require('./polyfills/web-crypto')
  defineEnumerableProperties(context, {
    crypto: new webCrypto.Crypto(),
    Crypto: webCrypto.Crypto,
    CryptoKey: webCrypto.CryptoKey,
    SubtleCrypto: webCrypto.SubtleCrypto,
  })

  const undici = require('./polyfills/undici')
  defineEnumerableProperties(context, {
    fetch: undici.fetch,
    File: undici.File,
    FormData: undici.FormData,
    Headers: undici.Headers,
    Request: undici.Request,
    Response: undici.Response,
  })

  const webCache = require('./polyfills/cache')
  defineEnumerableProperties(context, {
    caches: webCache(undici).cacheStorage(),
    CacheStorage: webCache.CacheStorage,
    Cache: webCache.Cache,
  })

  const webEvent = require('./polyfills/web-event')
  defineEnumerableProperties(context, {
    Event: webEvent.Event,
    EventTarget: webEvent.EventTarget,
    FetchEvent: webEvent.FetchEvent,
    PromiseRejectionEvent: webEvent.PromiseRejectionEvent,
  })

  const webStreams = require('./polyfills/web-streams')
  defineEnumerableProperties(context, {
    ReadableStream: webStreams.ReadableStream,
    ReadableStreamBYOBReader: webStreams.ReadableStreamBYOBReader,
    ReadableStreamDefaultReader: webStreams.ReadableStreamDefaultReader,
    TransformStream: webStreams.TransformStream,
    WritableStream: webStreams.WritableStream,
    WritableStreamDefaultWriter: webStreams.WritableStreamDefaultWriter,
  })

  const structuredClone = require('@ungap/structured-clone')
  defineEnumerableProperties(context, { structuredClone })

  const { URLPattern } = require('urlpattern-polyfill')
  defineEnumerableProperties(context, { URLPattern })

  defineEnumerableProperties(context, {
    Array,
    ArrayBuffer,
    Atomics,
    BigInt,
    BigInt64Array,
    BigUint64Array,
    Boolean,
    clearInterval,
    clearTimeout,
    console: require('./polyfills/console'),
    DataView,
    Date,
    decodeURI,
    decodeURIComponent,
    encodeURI,
    encodeURIComponent,
    Error,
    EvalError,
    Float32Array,
    Float64Array,
    Function,
    Infinity,
    Int8Array,
    Int16Array,
    Int32Array,
    Intl,
    isFinite,
    isNaN,
    JSON,
    Map,
    Math,
    Number,
    Object,
    parseFloat,
    parseInt,
    Promise,
    Proxy,
    RangeError,
    ReferenceError,
    Reflect,
    RegExp,
    Set,
    setInterval,
    setTimeout,
    SharedArrayBuffer,
    String,
    Symbol,
    SyntaxError,
    TextDecoder,
    TextEncoder,
    TypeError,
    Uint8Array,
    Uint8ClampedArray,
    Uint16Array,
    Uint32Array,
    URIError,
    URL,
    URLPattern,
    URLSearchParams,
    WeakMap,
    WeakSet,
    WebAssembly,
  })

  return context
}

export default addPrimitives(Object.create(null))
