import type { Headers } from '@edge-runtime/primitives'
import type { OutgoingHttpHeaders } from 'node:http'

export function transformToOugoingHeaders(
  headers: Headers,
  existingHeaders: OutgoingHttpHeaders = {}
) {
  for (const name of 'raw' in headers
    ? // @ts-ignore TODO @schniz where does raw come from?
      Object.keys(headers.raw())
    : headers.keys()) {
    const value =
      name === 'set-cookie' && 'getAll' in headers
        ? headers.getAll(name)
        : headers.get(name)
    if (value !== null) {
      existingHeaders[name] = value
    }
  }
  return existingHeaders
}
