const EventTargetShim = require('event-target-shim')

const { EventTarget } = EventTargetShim

// This is necessary just to have the right constructor name
class Event extends EventTargetShim {}

class FetchEvent extends Event {
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

class PromiseRejectionEvent extends Event {
  constructor(type, init) {
    super(type, { cancelable: true })
    this.promise = init.promise
    this.reason = init.reason
  }
}

module.exports = {
  Event,
  EventTarget,
  FetchEvent,
  PromiseRejectionEvent,
}
