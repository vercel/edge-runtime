import type * as EdgePrimitives from '@edge-runtime/primitives'
import type { VMContext, VMOptions } from './vm'
import { Buffer } from 'buffer'
import { requireWithCache } from './require'
import { VM } from './vm'
import { runInContext } from 'vm'

export interface EdgeVMOptions<T> {
  /**
   * Provide code generation options to the Node.js VM.
   * If you don't provide any option, code generation will be disabled.
   */
  codeGeneration?: VMOptions<T>['codeGeneration']
  /**
   * Allows to extend the VMContext. Note that it must return a contextified
   * object so ideally it should return the same reference it receives.
   */
  extend?: (context: EdgeContext) => EdgeContext & T
  /**
   * Provides an initial map to the require cache.
   * If none is given, it will be initialized to an empty map.
   */
  requireCache?: VMOptions<T>['requireCache']
}

/**
 * An implementation of a VM that pre-loads on its context Edge Primitives.
 * The context can be extended from its constructor.
 */
export class EdgeVM<T extends EdgeContext> extends VM<T> {
  constructor(options: EdgeVMOptions<T> = {}) {
    super({
      ...options,
      extend: (context) => {
        return options.extend
          ? options.extend(addPrimitives(context))
          : (addPrimitives(context) as EdgeContext & T)
      },
    })
  }
}

export type EdgeContext = VMContext & {
  self: EdgeContext
  globalThis: EdgeContext
  AbortController: typeof EdgePrimitives.AbortController
  AbortSignal: typeof EdgePrimitives.AbortSignal
  atob: typeof EdgePrimitives.atob
  Blob: typeof EdgePrimitives.Blob
  btoa: typeof EdgePrimitives.btoa
  Cache: typeof EdgePrimitives.Cache
  caches: typeof EdgePrimitives.caches
  CacheStorage: typeof EdgePrimitives.CacheStorage
  console: typeof EdgePrimitives.console
  createCaches: typeof EdgePrimitives.createCaches
  crypto: typeof EdgePrimitives.crypto
  Crypto: typeof EdgePrimitives.Crypto
  CryptoKey: typeof EdgePrimitives.CryptoKey
  DOMException: typeof EdgePrimitives.DOMException
  Event: typeof EdgePrimitives.Event
  EventTarget: typeof EdgePrimitives.EventTarget
  fetch: typeof EdgePrimitives.fetch
  FetchEvent: typeof EdgePrimitives.FetchEvent
  File: typeof EdgePrimitives.File
  FormData: typeof EdgePrimitives.FormData
  Headers: typeof EdgePrimitives.Headers
  PromiseRejectionEvent: typeof EdgePrimitives.PromiseRejectionEvent
  ReadableStream: typeof EdgePrimitives.ReadableStream
  ReadableStreamBYOBReader: typeof EdgePrimitives.ReadableStreamBYOBReader
  ReadableStreamDefaultReader: typeof EdgePrimitives.ReadableStreamDefaultReader
  Request: typeof EdgePrimitives.Request
  Response: typeof EdgePrimitives.Response
  structuredClone: typeof EdgePrimitives.structuredClone
  SubtleCrypto: typeof EdgePrimitives.SubtleCrypto
  TextDecoder: typeof EdgePrimitives.TextDecoder
  TextDecoderStream: typeof EdgePrimitives.TextDecoderStream
  TextEncoder: typeof EdgePrimitives.TextEncoder
  TextEncoderStream: typeof EdgePrimitives.TextEncoderStream
  TransformStream: typeof EdgePrimitives.TransformStream
  URL: typeof EdgePrimitives.URL
  URLPattern: typeof EdgePrimitives.URLPattern
  URLSearchParams: typeof EdgePrimitives.URLSearchParams
  WritableStream: typeof EdgePrimitives.WritableStream
  WritableStreamDefaultWriter: typeof EdgePrimitives.WritableStreamDefaultWriter
  EdgeRuntime: string
}

function addPrimitives(context: VMContext) {
  defineProperty(context, 'self', { enumerable: true, value: context })
  defineProperty(context, 'globalThis', { value: context })
  defineProperty(context, 'Symbol', { value: Symbol })
  defineProperty(context, 'clearInterval', { value: clearInterval })
  defineProperty(context, 'clearTimeout', { value: clearTimeout })
  defineProperty(context, 'setInterval', { value: setInterval })
  defineProperty(context, 'setTimeout', { value: setTimeout })
  defineProperty(context, 'EdgeRuntime', { value: 'edge-runtime' })

  // Console
  defineProperties(context, {
    exports: requireWithCache({
      context,
      path: require.resolve('@edge-runtime/primitives/console'),
      scopedContext: { console },
    }),
    nonenumerable: ['console'],
  })

  const encodings = requireWithCache({
    context,
    path: require.resolve('@edge-runtime/primitives/encoding'),
    scopedContext: { Buffer, global: {} },
  })

  // Encoding APIs
  defineProperties(context, {
    exports: encodings,
    nonenumerable: ['atob', 'btoa', 'TextEncoder', 'TextDecoder'],
  })

  const streams = requireWithCache({
    path: require.resolve('@edge-runtime/primitives/streams'),
    context,
  })

  // Streams
  defineProperties(context, {
    exports: streams,
    nonenumerable: [
      'ReadableStream',
      'ReadableStreamBYOBReader',
      'ReadableStreamDefaultReader',
      'TextDecoderStream',
      'TextEncoderStream',
      'TransformStream',
      'WritableStream',
      'WritableStreamDefaultWriter',
    ],
  })

  const abort = requireWithCache({
    context,
    path: require.resolve('@edge-runtime/primitives/abort-controller'),
  })

  // AbortController
  defineProperties(context, {
    exports: abort,
    nonenumerable: ['AbortController', 'AbortSignal', 'DOMException'],
  })

  // URL
  defineProperties(context, {
    exports: requireWithCache({
      cache: new Map([['punycode', { exports: require('punycode') }]]),
      context,
      path: require.resolve('@edge-runtime/primitives/url'),
      scopedContext: {
        TextEncoder: encodings.TextEncoder,
        TextDecoder: encodings.TextDecoder,
      },
    }),
    nonenumerable: ['URL', 'URLSearchParams', 'URLPattern'],
  })

  const blob = requireWithCache({
    context,
    path: require.resolve('@edge-runtime/primitives/blob'),
  })

  // Blob
  defineProperties(context, {
    exports: blob,
    nonenumerable: ['Blob'],
  })

  const webFetch = requireWithCache({
    context,
    cache: new Map([
      ['abort-controller', { exports: abort }],
      ['assert', { exports: require('assert') }],
      ['buffer', { exports: require('buffer') }],
      ['events', { exports: require('events') }],
      ['http', { exports: require('http') }],
      ['net', { exports: require('net') }],
      ['perf_hooks', { exports: require('perf_hooks') }],
      ['querystring', { exports: require('querystring') }],
      ['stream', { exports: require('stream') }],
      ['tls', { exports: require('tls') }],
      ['util', { exports: require('util') }],
      ['zlib', { exports: require('zlib') }],
      [
        require.resolve('@edge-runtime/primitives/streams'),
        { exports: streams },
      ],
      [require.resolve('@edge-runtime/primitives/blob'), { exports: blob }],
    ]),
    path: require.resolve('@edge-runtime/primitives/fetch'),
    scopedContext: {
      Uint8Array: createUint8ArrayForContext(context),
      Buffer,
      global: {},
      queueMicrotask,
      setImmediate,
      clearImmediate,
    },
  })

  // Fetch APIs
  defineProperties(context, {
    exports: webFetch,
    nonenumerable: [
      'fetch',
      'File',
      'FormData',
      'Headers',
      'Request',
      'Response',
    ],
  })

  // Cache
  defineProperties(context, {
    exports: requireWithCache({
      cache: new Map([
        [
          require.resolve('@edge-runtime/primitives/fetch'),
          { exports: webFetch },
        ],
      ]),
      context,
      path: require.resolve('@edge-runtime/primitives/cache'),
      scopedContext: { global: {} },
    }),
    enumerable: ['caches'],
    nonenumerable: ['Cache', 'CacheStorage'],
  })

  // Crypto
  defineProperties(context, {
    exports: requireWithCache({
      context,
      cache: new Map([
        ['crypto', { exports: require('crypto') }],
        ['process', { exports: require('process') }],
      ]),
      path: require.resolve('@edge-runtime/primitives/crypto'),
      scopedContext: {
        Buffer,
        Uint8Array: createUint8ArrayForContext(context),
      },
    }),
    enumerable: ['crypto'],
    nonenumerable: ['Crypto', 'CryptoKey', 'SubtleCrypto'],
  })

  // Events
  defineProperties(context, {
    exports: requireWithCache({
      context,
      path: require.resolve('@edge-runtime/primitives/events'),
    }),
    nonenumerable: [
      'Event',
      'EventTarget',
      'FetchEvent',
      'PromiseRejectionEvent',
    ],
  })

  // Structured Clone
  defineProperties(context, {
    exports: requireWithCache({
      context,
      path: require.resolve('@edge-runtime/primitives/structured-clone'),
    }),
    nonenumerable: ['structuredClone'],
  })

  return context as EdgeContext
}

function defineProperty(obj: any, prop: string, attrs: PropertyDescriptor) {
  Object.defineProperty(obj, prop, {
    configurable: attrs.configurable ?? false,
    enumerable: attrs.enumerable ?? false,
    value: attrs.value,
    writable: attrs.writable ?? true,
  })
}

function defineProperties(
  context: any,
  options: {
    exports: Record<string, any>
    enumerable?: string[]
    nonenumerable?: string[]
  }
) {
  for (const property of options.enumerable ?? []) {
    if (!options.exports[property]) {
      throw new Error(`Attempt to export a nullable value for "${property}"`)
    }

    defineProperty(context, property, {
      enumerable: true,
      value: options.exports[property],
    })
  }

  for (const property of options.nonenumerable ?? []) {
    if (!options.exports[property]) {
      throw new Error(`Attempt to export a nullable value for "${property}"`)
    }

    defineProperty(context, property, {
      value: options.exports[property],
    })
  }
}

function createUint8ArrayForContext(context: VMContext) {
  return new Proxy(runInContext('Uint8Array', context), {
    // on every construction (new Uint8Array(...))
    construct(target, args) {
      // construct it
      const value: Uint8Array = new target(...args)

      // if this is not a buffer
      if (!(args[0] instanceof Buffer)) {
        // return what we just constructed
        return value
      }

      // if it is a buffer, then we spread the binary data into an array,
      // and build the Uint8Array from that
      return new target([...value])
    },
  })
}
