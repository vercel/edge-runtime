import type { EventTarget } from 'event-target-shim'

declare const EventTargetConstructor: typeof EventTarget
declare const EventConstructor: typeof Event

export { EventConstructor as Event }

export class FetchEvent {
  request: Request
  response: Response | null
  awaiting: Set<Promise<void>>
  constructor(request: Request)
  respondWith(response: Response | Promise<Response>): void
  waitUntil(promise: Promise<void>): void
}

export { EventTargetConstructor as EventTarget }
export { EventTarget as PromiseRejectionEvent } from 'event-target-shim'
