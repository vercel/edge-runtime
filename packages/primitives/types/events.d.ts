import type { Event as EventI, EventTarget } from 'event-target-shim'

export class Event implements EventI {}

export class FetchEvent {
  awaiting: Set<Promise<void>>
  constructor(request: Request)
}

export { EventTarget } from 'event-target-shim'
export { EventTarget as PromiseRejectionEvent } from 'event-target-shim'

