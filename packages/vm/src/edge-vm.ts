import type * as EdgePrimitives from '@edge-runtime/primitives'
import type { DispatchFetch, ErrorHandler, RejectionHandler } from './types'
import { requireWithFakeGlobalScope } from './require'
import { runInContext } from 'vm'
import { VM, type VMContext, type VMOptions } from './vm'
import * as streamsImpl from '@edge-runtime/primitives/streams'
import * as consoleImpl from '@edge-runtime/primitives/console'
import * as abortControllerImpl from '@edge-runtime/primitives/abort-controller'
import * as urlImpl from '@edge-runtime/primitives/url'
import * as cryptoImpl from '@edge-runtime/primitives/crypto'
import * as eventsImpl from '@edge-runtime/primitives/events'
import * as structuredCloneImpl from '@edge-runtime/primitives/structured-clone'

export interface EdgeVMOptions<T extends EdgeContext> {
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
   * Code to be evaluated as when the Edge Runtime is created. This is handy
   * to run code directly instead of first creating the runtime and then
   * evaluating.
   */
  initialCode?: string
  /**
   * Provides an initial map to the require cache.
   * If none is given, it will be initialized to an empty map.
   */
  requireCache?: VMOptions<T>['requireCache']
}

/**
 * Store handlers that the user defined from code so that we can invoke them
 * from the Node.js realm.
 */
let unhandledRejectionHandlers: RejectionHandler[]
let uncaughtExceptionHandlers: ErrorHandler[]

export class EdgeVM<T extends EdgeContext = EdgeContext> extends VM<T> {
  public readonly dispatchFetch: DispatchFetch

  constructor(options?: EdgeVMOptions<T>) {
    super({
      ...options,
      extend: (context) => {
        return options?.extend
          ? options.extend(addPrimitives(context))
          : (addPrimitives(context) as EdgeContext & T)
      },
    })

    Object.defineProperty(this.context, '__onUnhandledRejectionHandlers', {
      set: registerUnhandledRejectionHandlers,
      configurable: false,
      enumerable: false,
    })
    Object.defineProperty(this, '__rejectionHandlers', {
      get: () => unhandledRejectionHandlers,
      configurable: false,
      enumerable: false,
    })

    Object.defineProperty(this.context, '__onErrorHandlers', {
      set: registerUncaughtExceptionHandlers,
      configurable: false,
      enumerable: false,
    })
    Object.defineProperty(this, '__errorHandlers', {
      get: () => uncaughtExceptionHandlers,
      configurable: false,
      enumerable: false,
    })

    this.evaluate<void>(getDefineEventListenersCode())
    this.dispatchFetch = this.evaluate<DispatchFetch>(getDispatchFetchCode())
    ;[
      'Object',
      'Uint8Array',
      'ArrayBuffer',
      'Error',
      'SyntaxError',
      'TypeError',
    ].forEach((item) => {
      patchInstanceOf(item, this.context)
    })

    if (options?.initialCode) {
      this.evaluate(options.initialCode)
    }
  }
}

function patchInstanceOf(item: string, ctx: any) {
  // @ts-ignore
  ctx[Symbol.for(`node:${item}`)] = eval(item)

  return runInContext(
    `
      globalThis.${item} = new Proxy(${item}, {
        get(target, prop, receiver) {
          if (prop === Symbol.hasInstance) {
            const nodeTarget = globalThis[Symbol.for('node:${item}')];
            if (nodeTarget) {
              return function(instance) {
                return instance instanceof target || instance instanceof nodeTarget;
              };
            }
          }

          return Reflect.get(target, prop, receiver);
        }
      })`,
    ctx
  )
}

/**
 * Register system-level handlers to make sure that we report to the user
 * whenever there is an unhandled rejection or exception before the process crashes.
 * Do it on demand so we don't swallow rejections/errors for no reason.
 */
function registerUnhandledRejectionHandlers(handlers: RejectionHandler[]) {
  if (!unhandledRejectionHandlers) {
    process.on(
      'unhandledRejection',
      function invokeRejectionHandlers(reason, promise) {
        unhandledRejectionHandlers.forEach((handler) =>
          handler({ reason, promise })
        )
      }
    )
  }
  unhandledRejectionHandlers = handlers
}

function registerUncaughtExceptionHandlers(handlers: ErrorHandler[]) {
  if (!uncaughtExceptionHandlers) {
    process.on('uncaughtException', function invokeErrorHandlers(error) {
      uncaughtExceptionHandlers.forEach((handler) => handler(error))
    })
  }
  uncaughtExceptionHandlers = handlers
}

/**
 * Generates polyfills for addEventListener and removeEventListener. It keeps
 * all listeners in hidden property __listeners. It will also call a hook
 * `__onUnhandledRejectionHandler` and `__onErrorHandler` when unhandled rejection
 * events are added or removed and prevent from having more than one FetchEvent
 * handler.
 */
function getDefineEventListenersCode() {
  return `
    Object.defineProperty(self, '__listeners', {
      configurable: false,
      enumerable: false,
      value: {},
      writable: true,
    })

    function __conditionallyUpdatesHandlerList(eventType) {
      if (eventType === 'unhandledrejection') {
        self.__onUnhandledRejectionHandlers = self.__listeners[eventType];
      } else if (eventType === 'error') {
        self.__onErrorHandlers = self.__listeners[eventType];
      }
    }

    function addEventListener(type, handler) {
      const eventType = type.toLowerCase();
      if (eventType === 'fetch' && self.__listeners.fetch) {
        throw new TypeError('You can register just one "fetch" event listener');
      }

      self.__listeners[eventType] = self.__listeners[eventType] || [];
      self.__listeners[eventType].push(handler);
      __conditionallyUpdatesHandlerList(eventType);
    }

    function removeEventListener(type, handler) {
      const eventType = type.toLowerCase();
      if (self.__listeners[eventType]) {
        self.__listeners[eventType] = self.__listeners[eventType].filter(item => {
          return item !== handler;
        });

        if (self.__listeners[eventType].length === 0) {
          delete self.__listeners[eventType];
        }
      }
      __conditionallyUpdatesHandlerList(eventType);
    }
  `
}

/**
 * Generates the code to dispatch a FetchEvent invoking the handlers defined
 * for such events. In case there is no event handler defined it will throw
 * an error.
 */
function getDispatchFetchCode() {
  return `(async function dispatchFetch(input, init) {
    const request = new Request(input, init);
    const event = new FetchEvent(request);
    if (!self.__listeners.fetch) {
      throw new Error("No fetch event listeners found");
    }

    const getResponse = ({ response, error }) => {
     if (error || !response || !(response instanceof Response)) {
        console.error(error ? error.toString() : 'The event listener did not respond')
        response = new Response(null, {
          statusText: 'Internal Server Error',
          status: 500
        })
      }

      response.waitUntil = () => Promise.all(event.awaiting);

      if (response.status < 300 || response.status >= 400 ) {
        response.headers.delete('content-encoding');
        response.headers.delete('transform-encoding');
        response.headers.delete('content-length');
      }

      return response;
    }

    try {
      await self.__listeners.fetch[0].call(event, event)
    } catch (error) {
      return getResponse({ error })
    }

    return Promise.resolve(event.response)
      .then(response => getResponse({ response }))
      .catch(error => getResponse({ error }))
  })`
}

export type EdgeContext = VMContext & {
  self: EdgeContext
  globalThis: EdgeContext
  AbortController: typeof EdgePrimitives.AbortController
  AbortSignal: typeof EdgePrimitives.AbortSignal
  atob: typeof EdgePrimitives.atob
  Blob: typeof EdgePrimitives.Blob
  btoa: typeof EdgePrimitives.btoa
  console: typeof EdgePrimitives.console
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
    exports: consoleImpl,
    nonenumerable: ['console'],
  })

  // Encoding APIs
  defineProperties(context, {
    exports: { atob, btoa, TextEncoder, TextDecoder },
    nonenumerable: ['atob', 'btoa', 'TextEncoder', 'TextDecoder'],
  })

  const textEncodingStreamImpl = requireWithFakeGlobalScope({
    path: require.resolve('@edge-runtime/primitives/text-encoding-streams'),
    scopedContext: streamsImpl,
  })

  // Streams
  defineProperties(context, {
    exports: { ...streamsImpl, ...textEncodingStreamImpl },
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

  // AbortController
  defineProperties(context, {
    exports: abortControllerImpl,
    nonenumerable: ['AbortController', 'AbortSignal', 'DOMException'],
  })

  // URL
  defineProperties(context, {
    exports: urlImpl,
    nonenumerable: ['URL', 'URLSearchParams', 'URLPattern'],
  })

  // Blob
  defineProperties(context, {
    exports: requireWithFakeGlobalScope({
      path: require.resolve('@edge-runtime/primitives/blob'),
      scopedContext: streamsImpl,
    }),
    nonenumerable: ['Blob'],
  })

  // Fetch APIs
  defineProperties(context, {
    exports: requireWithFakeGlobalScope({
      path: require.resolve('@edge-runtime/primitives/fetch'),
      scopedContext: { ...streamsImpl, ...urlImpl },
    }),
    nonenumerable: [
      'fetch',
      'File',
      'FormData',
      'Headers',
      'Request',
      'Response',
    ],
  })

  // Crypto
  defineProperties(context, {
    exports: cryptoImpl,
    enumerable: ['crypto'],
    nonenumerable: ['Crypto', 'CryptoKey', 'SubtleCrypto'],
  })

  // Events
  defineProperties(context, {
    exports: eventsImpl,
    nonenumerable: [
      'Event',
      'EventTarget',
      'FetchEvent',
      'PromiseRejectionEvent',
    ],
  })

  // Structured Clone
  defineProperties(context, {
    exports: structuredCloneImpl,
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
