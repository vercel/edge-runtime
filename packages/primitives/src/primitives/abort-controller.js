import { EventTarget } from './events'

const kSignal = Symbol('kSignal')
const kAborted = Symbol('kAborted')
const kReason = Symbol('kReason')
const kName = Symbol('kName')

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
  const signal = new EventTarget('abort')
  Object.setPrototypeOf(signal, AbortSignal.prototype)
  signal[kAborted] = false
  signal[kReason] = undefined
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
  signal.dispatchEvent({ type: 'abort' }) // TODO: why can't we use `new Event('abort')` ??
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

export class AbortSignal extends EventTarget('abort') {
  constructor() {
    throw new TypeError('Illegal constructor.')
  }

  get aborted() {
    return this[kAborted]
  }

  get reason() {
    return this[kReason]
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
