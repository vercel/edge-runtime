import * as EdgeRuntime from '@edge-runtime/primitives'
import { buildToFetchEvent } from '../../src'

const toFetchEvent = buildToFetchEvent({
  Headers: EdgeRuntime.Headers,
  ReadableStream: EdgeRuntime.ReadableStream,
  Request: EdgeRuntime.Request,
  Uint8Array: Uint8Array,
  FetchEvent: EdgeRuntime.FetchEvent,
})

it('returns a fetch event with a request', () => {
  const request = new EdgeRuntime.Request('https://vercel.com')
  const event = toFetchEvent(request)
  expect(event).toBeInstanceOf(EdgeRuntime.FetchEvent)
  expect(event.request).toBe(request)
})

it('throws when accessing waitUntil', () => {
  const request = new EdgeRuntime.Request('https://vercel.com')
  const event = toFetchEvent(request)
  expect(() => event.waitUntil(Promise.resolve())).toThrow(
    'waitUntil is not supported yet.'
  )
})
