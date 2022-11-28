import type { Headers } from '@edge-runtime/primitives'
import type { IncomingHttpHeaders } from 'http'

interface Dependencies {
  Headers: typeof Headers
}

export function buildNodeHeadersToHeaders({ Headers }: Dependencies) {
  return function nodeHeadersToHeaders(
    nodeHeaders: IncomingHttpHeaders
  ): Headers {
    const headers = new Headers()
    for (let [key, value] of Object.entries(nodeHeaders)) {
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
