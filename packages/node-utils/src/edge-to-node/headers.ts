import { Headers } from '@edge-runtime/primitives'
import type { OutgoingHttpHeaders, ServerResponse } from 'node:http'

export function toOutgoingHeaders(headers?: Headers): OutgoingHttpHeaders {
  const outputHeaders: OutgoingHttpHeaders = {}
  if (headers) {
    const _headers = new Headers(headers).entries()
    for (const [name, value] of _headers) {
      outputHeaders[name] =
        name === 'set-cookie' ? headers.getSetCookie() : value
    }
  }
  return outputHeaders
}

export function mergeIntoServerResponse(
  headers: OutgoingHttpHeaders,
  serverResponse: ServerResponse,
) {
  for (const [name, value] of Object.entries(headers)) {
    if (value !== undefined) {
      serverResponse.setHeader(name, value)
    }
  }
}
