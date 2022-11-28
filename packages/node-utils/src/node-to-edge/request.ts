import type { IncomingMessage } from 'node:http'
import type { Request } from '@edge-runtime/primitives'
import { buildToHeaders } from './headers'
import { buildToReadableStream } from './stream'
import { BuildDependencies, RequestOptions } from '../types'

export function buildToRequest(dependencies: BuildDependencies) {
  const toHeaders = buildToHeaders(dependencies)
  const toReadableStream = buildToReadableStream(dependencies)
  const { Request } = dependencies
  return function toRequest(
    request: IncomingMessage,
    options: RequestOptions
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
