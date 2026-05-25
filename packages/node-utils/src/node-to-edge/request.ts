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
    options: RequestOptions,
  ): Request {
    const base = computeOrigin(request, options.defaultOrigin)
    return new Request(
      String(
        request.url?.startsWith('//')
          ? new URL(base + request.url)
          : new URL(request.url || '/', base),
      ),
      {
        method: request.method,
        headers: toHeaders(request.headers),
        body: !['HEAD', 'GET'].includes(request.method ?? '')
          ? toReadableStream(request)
          : null,
      },
    )
  }
}

function getSingleHeader(
  headers: IncomingMessage['headers'],
  name: string,
): string | undefined {
  const value = headers[name]
  if (value === undefined) {
    return undefined
  }
  return Array.isArray(value) ? value[0] : value
}

function computeOrigin({ headers }: IncomingMessage, defaultOrigin: string) {
  const authority =
    getSingleHeader(headers, 'host') ?? getSingleHeader(headers, ':authority')
  if (!authority) {
    return defaultOrigin
  }

  let protocol = 'http'
  if (defaultOrigin) {
    try {
      protocol = new URL(defaultOrigin).protocol.replace(':', '') || 'http'
    } catch {
      // keep default
    }
  }

  const [, port] = authority.split(':')
  if (port === '443') {
    protocol = 'https'
  }

  return `${protocol}://${authority}`
}
