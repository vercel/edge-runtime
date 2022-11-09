import type { EventTarget } from 'event-target-shim'

declare const EventTargetConstructor: typeof EventTarget
declare const EventConstructor: typeof Event

export { EventConstructor as Event }

export declare class FetchEvent {
  request: Request
  response: Response | null
  awaiting: Set<Promise<void>>
  constructor(request: Request)
  respondWith(response: Response | Promise<Response>): void
  waitUntil(promise: Promise<void>): void
}

export {
  EventConstructor as Event,
  EventTargetConstructor as EventTarget,
  EventTarget as PromiseRejectionEvent
}
