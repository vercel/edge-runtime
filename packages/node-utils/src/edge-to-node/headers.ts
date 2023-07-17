import type { Headers } from '@edge-runtime/primitives'
import type { OutgoingHttpHeaders, ServerResponse } from 'node:http'
import { splitCookiesString } from '@edge-runtime/cookies'

export function toOutgoingHeaders(
  headers?: Headers & { raw?: () => Record<string, string> },
): OutgoingHttpHeaders {
  const outputHeaders: OutgoingHttpHeaders = {}
  if (headers) {
    for (const [name, value] of typeof headers.raw !== 'undefined'
      ? Object.entries(headers.raw())
      : headers.entries()) {
      outputHeaders[name] = value
      if (name.toLowerCase() === 'set-cookie') {
        outputHeaders[name] =
          headers.getAll?.('set-cookie') ?? splitCookiesString(value)
      }
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
