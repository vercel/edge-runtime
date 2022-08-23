import { EventTarget, Event } from './events'

const kSignal = Symbol('kSignal')
const kAborted = Symbol('kAborted')
const kReason = Symbol('kReason')
const kName = Symbol('kName')
const kOnabort = Symbol('kOnabort')

// this polyfill is heavily inspired from @flemist/abort-controller
// @see https://github.com/NikolayMakhonin/abort-controller/tree/master/src/original
export class DOMException extends Error {
  constructor(message, name) {
    super(message)
    this[kName] = name
  }

  get name() {
    return this[kName]
  }
}

function createAbortSignal() {
  const signal = new EventTarget()
  Object.setPrototypeOf(signal, AbortSignal.prototype)
  signal[kAborted] = false
  signal[kReason] = undefined
  signal[kOnabort] = undefined
  return signal
}

function abortSignalAbort(signal, reason) {
  if (typeof reason === 'undefined') {
    reason = new DOMException('The operation was aborted.', 'AbortError')
  }
  if (signal.aborted) {
    return
  }

  signal[kReason] = reason
  signal[kAborted] = true
  signal.dispatchEvent(new Event('abort'))
}

export class AbortController {
  constructor() {
    this[kSignal] = createAbortSignal()
  }

  get signal() {
    return this[kSignal]
  }

  abort(reason) {
    abortSignalAbort(this.signal, reason)
  }
}

export class AbortSignal extends EventTarget {
  constructor() {
    throw new TypeError('Illegal constructor.')
  }

  get aborted() {
    return this[kAborted]
  }

  get reason() {
    return this[kReason]
  }

  get onabort() {
    return this[kOnabort]
  }

  set onabort(value) {
    if (this[kOnabort]) {
      this.removeEventListener('abort', this[kOnabort])
    }
    if (value) {
      this[kOnabort] = value
      this.addEventListener('abort', this[kOnabort])
    }
  }

  throwIfAborted() {
    if (this[kAborted]) {
      throw this[kReason]
    }
  }

  static abort(reason) {
    const signal = createAbortSignal()
    abortSignalAbort(signal, reason)
    return signal
  }

  static timeout(milliseconds) {
    const signal = createAbortSignal()
    setTimeout(() => {
      abortSignalAbort(
        signal,
        new DOMException('The operation timed out.', 'TimeoutError')
      )
    }, milliseconds)
    return signal
  }
}
