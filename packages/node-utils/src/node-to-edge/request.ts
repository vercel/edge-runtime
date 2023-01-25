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
    return new Request(
      String(
        new URL(
          request.url || '/',
          computeOrigin(request, options.defaultOrigin)
        )
      ),
      {
        method: request.method,
        headers: toHeaders(request.headers),
        body: !['HEAD', 'GET'].includes(request.method ?? '')
          ? toReadableStream(request)
          : null,
      }
    )
  }
}

function computeOrigin({ headers }: IncomingMessage, defaultOrigin: string) {
  const authority = headers.host
  if (!authority) {
    return defaultOrigin
  }
  const [, port] = authority.split(':')
  return `${port === '443' ? 'https' : 'http'}://${authority}`
}
