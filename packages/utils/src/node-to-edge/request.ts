import type { IncomingMessage } from 'node:http'
import type { Request, Headers } from '@edge-runtime/primitives'
import { buildNodeHeadersToHeaders } from './headers'
import { buildNodeReadableToReadableStream } from './stream'

interface Dependencies {
  Headers: typeof Headers
  ReadableStream: typeof ReadableStream
  Request: typeof Request
  Uint8Array: typeof Uint8Array
}

interface Options {
  origin: string
}

export function buildNodeRequestToRequest(dependencies: Dependencies) {
  const toHeaders = buildNodeHeadersToHeaders(dependencies)
  const toReadableStream = buildNodeReadableToReadableStream(dependencies)
  const { Request } = dependencies
  return function nodeRequestToRequest(
    request: IncomingMessage,
    options: Options
  ): Request {
    return new Request(String(new URL(request.url || '/', options.origin)), {
      method: request.method,
      headers: toHeaders(request.headers),
      body: !['HEAD', 'GET'].includes(request.method ?? '')
        ? toReadableStream(request)
        : null,
    })
  }
}
