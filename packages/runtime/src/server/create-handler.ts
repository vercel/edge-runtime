import type { EdgeRuntime } from '../edge-runtime'
import type { IncomingMessage, ServerResponse } from 'http'
import type { Logger, NodeHeaders } from '../types'
import type { EdgeContext } from '@edge-runtime/vm'
import {
  consumeUint8ArrayReadableStream,
  getClonableBodyStream,
} from './body-streams'
import prettyMs from 'pretty-ms'
import timeSpan from 'time-span'

import { STATUS_CODES } from 'http'

export interface Options<T extends EdgeContext> {
  /**
   * A logger interface. If none is provided there will be no logs.
   */
  logger?: Logger
  /**
   * The runtime where the FetchEvent will be triggered whenever the server
   * receives a request.
   */
  runtime: EdgeRuntime<T>
}

/**
 * Creates an HHTP handler that can be used to create a Node.js HTTP server.
 * Whenever a request is handled it will transform it into a `dispatchFetch`
 * call for the given `EdgeRuntime`. Then it will transform the response
 * into an HTTP response.
 */
export function createHandler<T extends EdgeContext>(options: Options<T>) {
  const awaiting: Set<Promise<unknown>> = new Set()

  return {
    handler: async (req: IncomingMessage, res: ServerResponse) => {
      try {
        const start = timeSpan()

        const body =
          req.method !== 'GET' && req.method !== 'HEAD'
            ? getClonableBodyStream(
                req,
                options.runtime.evaluate('Uint8Array'),
                options.runtime.context.TransformStream
              )
            : undefined

        const response = await options.runtime.dispatchFetch(
          String(getURL(req)),
          {
            headers: toRequestInitHeaders(req),
            method: req.method,
            body: body?.cloneBodyStream(),
          }
        )

        const waitUntil = response.waitUntil()
        awaiting.add(waitUntil)
        waitUntil.finally(() => awaiting.delete(waitUntil))

        res.statusCode = response.status
        res.statusMessage = response.statusText

        for (const [key, value] of Object.entries(
          toNodeHeaders(response.headers)
        )) {
          if (value !== undefined) {
            res.setHeader(key, value)
          }
        }

        await stream(response.body, res)

        const subject = `${req.socket.remoteAddress} ${req.method} ${req.url}`
        const time = `${prettyMs(start())
          .match(/[a-zA-Z]+|[0-9]+/g)
          ?.join(' ')}`

        const code = `${res.statusCode} ${STATUS_CODES[res.statusCode]}`
        options.logger?.debug(`${subject} → ${code} in ${time}`)
        res.end()
      } finally {
        if (!res.writableEnded) {
          res.end()
        }
      }
    },

    waitUntil: () => Promise.all(awaiting),
  }
}

async function stream(
  body: ReadableStream<Uint8Array> | null,
  res: ServerResponse
) {
  if (!body) return

  // If the client has already disconnected, then we don't need to pipe anything.
  if (res.destroyed) return body.cancel()

  // When the server pushes more data than the client reads, then we need to
  // wait for the client to catch up before writing more data. We register this
  // generic handler once so that we don't incur constant register/unregister
  // calls.
  let drainResolve: () => void
  res.on('drain', () => drainResolve?.())

  // If the user aborts, then we'll receive a close event before the
  // body closes. In that case, we want to end the streaming.
  let open = true
  res.on('close', () => {
    open = false
    drainResolve?.()
  })

  const stream = consumeUint8ArrayReadableStream(body)
  for await (const chunk of stream) {
    const bufferSpaceAvailable = res.write(chunk)

    // If there's no more space in the buffer, then we need to wait on the
    // client to read data before pushing again.
    if (!bufferSpaceAvailable) {
      await new Promise<void>((res) => {
        drainResolve = res
      })
    }

    // If the client disconnects, then we need to manually cleanup the stream
    // iterator so the body can release its resources.
    if (!open) {
      stream.return()
      break
    }
  }
}

/**
 * Builds a full URL from the provided incoming message. Note this function
 * is not safe as one can set has a host anything based on headers. It is
 * useful to build the fetch request full URL.
 */
function getURL(req: IncomingMessage) {
  const proto = (req.socket as any)?.encrypted ? 'https' : 'http'
  return new URL(String(req.url), `${proto}://${String(req.headers.host)}`)
}

/**
 * Takes headers from IncomingMessage and transforms them into the signature
 * accepted by fetch. It simply folds headers into a single value when they
 * hold an array. For others it just copies the value.
 */
function toRequestInitHeaders(req: IncomingMessage): RequestInit['headers'] {
  return Object.keys(req.headers).map((key) => {
    const value = req.headers[key]
    return [key, Array.isArray(value) ? value.join(', ') : value ?? '']
  })
}

/**
 * Transforms WHATWG Headers into a Node Headers shape. Copies all items but
 * does a special case for Set-Cookie using the hidden method getAll which
 * allows to get all cookies instead of a folded value.
 */
function toNodeHeaders(headers?: Headers): NodeHeaders {
  const result: NodeHeaders = {}
  if (headers) {
    for (const [key, value] of headers.entries()) {
      result[key] =
        key.toLowerCase() === 'set-cookie'
          ? // @ts-ignore getAll is hidden in Headers but exists.
            headers.getAll('set-cookie')
          : value
    }
  }
  return result
}
