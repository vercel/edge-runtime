import type * as EdgePrimitives from '@edge-runtime/primitives'
import { load as loadPrimitives } from '@edge-runtime/primitives/load'
import type { DispatchFetch, ErrorHandler, RejectionHandler } from './types'
import { Context, runInContext } from 'vm'
import { VM, type VMContext, type VMOptions } from './vm'

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
    for (const name of transferableConstructors) {
      patchInstanceOf(name, this.context)
    }

    if (options?.initialCode) {
      this.evaluate(options.initialCode)
    }
  }
}

/**
 * Transferable constructors are the constructors that we expect to be
 * "shared" between the realms.
 *
 * When a user creates an instance of one of these constructors, we want
 * to make sure that the `instanceof` operator works as expected:
 *
 * * If the instance was created in the Node.js realm, then `instanceof`
 *   should return true when used in the EdgeVM realm.
 * * If the instance was created in the EdgeVM realm, then `instanceof`
 *   should return true when used in the EdgeVM realm.
 *
 * For example, the return value from `new TextEncoder().encode("hello")` is a
 * Uint8Array. Since `TextEncoder` implementation is coming from the Node.js realm,
 * therefore the following will be false, which doesn't fit the expectation of the user:
 * ```ts
 * new TextEncoder().encode("hello") instanceof Uint8Array
 * ```
 *
 * This is because the `Uint8Array` in the `vm` context is not the same
 * as the one in the Node.js realm.
 *
 * Patching the constructors in the `vm` is done by the {@link patchInstanceOf}
 * function, and this is the list of constructors that need to be patched.
 *
 * These constructors are also being injected as "globals" when the VM is
 * constructed, by passing them as arguments to the {@link loadPrimitives}
 * function.
 */
const transferableConstructors = [
  'Object',
  'Array',
  'RegExp',
  'Uint8Array',
  'ArrayBuffer',
  'Error',
  'SyntaxError',
  'TypeError',
] as const

const patchedPrototypes = new Set<(typeof transferableConstructors)[number]>([
  'Array',
  'Object',
  'RegExp',
])

function patchInstanceOf(
  item: (typeof transferableConstructors)[number],
  ctx: any,
) {
  // @ts-ignore
  ctx[Symbol.for(`node:${item}`)] = eval(item)

  const shouldPatchPrototype = patchedPrototypes.has(item)

  return runInContext(
    `
    (() => {
      const proxy = new Proxy(${item}, {
        get(target, prop, receiver) {
          if (prop === Symbol.hasInstance && receiver === globalThis.${item}) {
            const nodeTarget = globalThis[Symbol.for('node:${item}')];
            if (nodeTarget) {
              return function(instance) {
                return instance instanceof target || instance instanceof nodeTarget;
              };
            } else {
              throw new Error('node target must exist')
            }
          }

          return Reflect.get(target, prop, receiver);
        },
        construct(target, args, newTarget) {
          return Object.assign(
            Reflect.construct(target, args, newTarget),
            { constructor: proxy }
          );
        }
      })

      globalThis.${item} = proxy;

      ${
        !shouldPatchPrototype
          ? ''
          : `Object.assign(globalThis.${item}.prototype, {
              get constructor() {
                return proxy;
              }
            })`
      }
    })()
    `,
    ctx,
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
          handler({ reason, promise }),
        )
      },
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

    Object.defineProperty(self, '__conditionallyUpdatesHandlerList', {
      configurable: false,
      enumerable: false,
      value: function(eventType) {
        if (eventType === 'unhandledrejection') {
          self.__onUnhandledRejectionHandlers = self.__listeners[eventType];
        } else if (eventType === 'error') {
          self.__onErrorHandlers = self.__listeners[eventType];
        }
      },
      writable: false,
    })

    function addEventListener(type, handler) {
      const eventType = type.toLowerCase();
      if (eventType === 'fetch' && self.__listeners.fetch) {
        throw new TypeError('You can register just one "fetch" event listener');
      }

      self.__listeners[eventType] = self.__listeners[eventType] || [];
      self.__listeners[eventType].push(handler);
      self.__conditionallyUpdatesHandlerList(eventType);
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
      self.__conditionallyUpdatesHandlerList(eventType);
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

      if (response.status < 300 || response.status >= 400 ) {
        const headers = new Headers(response.headers);
        headers.delete('content-encoding');
        headers.delete('transform-encoding');
        headers.delete('content-length');
        response = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      }
      response.waitUntil = () => Promise.all(event.awaiting);
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
  setTimeout: typeof EdgePrimitives.setTimeout
  setInterval: typeof EdgePrimitives.setInterval
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
  defineProperty(context, 'queueMicrotask', { value: queueMicrotask })
  defineProperty(context, 'EdgeRuntime', { value: 'edge-runtime' })

  const transferables = getTransferablePrimitivesFromContext(context)

  defineProperties(context, {
    exports: loadPrimitives({
      ...transferables,
      WeakRef: runInContext(`WeakRef`, context),
    }),
    enumerable: ['crypto'],
    nonenumerable: [
      // Crypto
      'Crypto',
      'CryptoKey',
      'SubtleCrypto',

      // Fetch APIs
      'fetch',
      'File',
      'FormData',
      'Headers',
      'Request',
      'Response',
      'WebSocket',

      // Structured Clone
      'structuredClone',

      // Blob
      'Blob',

      // URL
      'URL',
      'URLSearchParams',
      'URLPattern',

      // AbortController
      'AbortController',
      'AbortSignal',
      'DOMException',

      // Streams
      'ReadableStream',
      'ReadableStreamBYOBReader',
      'ReadableStreamDefaultReader',
      'TextDecoderStream',
      'TextEncoderStream',
      'TransformStream',
      'WritableStream',
      'WritableStreamDefaultWriter',

      // Encoding
      'atob',
      'btoa',
      'TextEncoder',
      'TextDecoder',

      // Events
      'Event',
      'EventTarget',
      'FetchEvent',
      'PromiseRejectionEvent',

      // Console
      'console',

      // Performance
      'performance',

      // Timers
      'setTimeout',
      'setInterval',
    ],
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
  },
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

/**
 * Create an object that contains all the {@link transferableConstructors}
 * implemented in the provided context.
 */
function getTransferablePrimitivesFromContext(
  context: Context,
): Record<(typeof transferableConstructors)[number], unknown> {
  const keys = transferableConstructors.join(',')
  const stringifedObject = `({${keys}})`
  return runInContext(stringifedObject, context)
}
