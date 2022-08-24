import { EventTarget, Event } from 'event-target-shim'

export { EventTarget, Event }

export class FetchEvent extends Event {
  constructor(request) {
    super('fetch')
    this.request = request
    this.response = null
    this.awaiting = new Set()
  }

  respondWith(response) {
    this.response = response
  }

  waitUntil(promise) {
    this.awaiting.add(promise)
    promise.finally(() => this.awaiting.delete(promise))
  }
}

export class PromiseRejectionEvent extends Event {
  constructor(type, init) {
    super(type, { cancelable: true })
    this.promise = init.promise
    this.reason = init.reason
  }
}
