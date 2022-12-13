import type { DispatchFetch, ErrorHandler, RejectionHandler } from './types'
import type { EdgeVMOptions, EdgeContext } from '@edge-runtime/vm'
import { EdgeVM } from '@edge-runtime/vm'

interface Options<T extends EdgeContext> extends EdgeVMOptions<T> {
  /**
   * Code to be evaluated as the VM for the Runtime is created. This is handy
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

/**
 * An EdgeVM that also allows to add and remove event listeners for unhandled
 * rejections and FetchEvent. It also allows to dispatch fetch events which
 * enables it to work behind a server.
 */
export class EdgeRuntime<
  T extends EdgeContext = EdgeContext
> extends EdgeVM<T> {
  public readonly dispatchFetch: DispatchFetch

  constructor(options?: Options<T>) {
    super({
      ...options,
      extend: (context) => {
        return options?.extend?.(context) ?? (context as EdgeContext & T)
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
    if (options?.initialCode) {
      this.evaluate(options.initialCode)
    }
  }
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
