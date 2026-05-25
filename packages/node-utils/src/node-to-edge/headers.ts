import type { Headers } from '@edge-runtime/primitives'
import type { IncomingHttpHeaders } from 'http'

interface Dependencies {
  Headers: typeof Headers
}

export function buildToHeaders({ Headers }: Dependencies) {
  return function toHeaders(nodeHeaders: IncomingHttpHeaders): Headers {
    const headers = new Headers()
    for (let [key, value] of Object.entries(nodeHeaders)) {
      // HTTP/2 pseudo-headers (e.g. :authority) are not valid Fetch header names.
      if (key.startsWith(':')) {
        continue
      }
      const values = Array.isArray(value) ? value : [value]
      for (let v of values) {
        if (v !== undefined) {
          headers.append(key, v)
        }
      }
    }
    return headers
  }
}
