import type { IncomingMessage, ServerResponse } from 'http'
import { Readable } from 'stream'
import type { WebHandler, NodeHandler } from '../types'
import { transformToOugoingHeaders } from './headers'

export function transformToNode(webHandler: WebHandler): NodeHandler {
  return (request: IncomingMessage, response: ServerResponse) => {
    // TODO supports the second parameter
    // @ts-ignore TODO map IncompingMessage into Request
    const maybePromise = webHandler(request)
    const mapResponse = buildResponseMapper(response)
    if (maybePromise instanceof Promise) {
      maybePromise.then(mapResponse)
    } else {
      mapResponse(maybePromise)
    }
  }
}

function buildResponseMapper(serverResponse: ServerResponse) {
  return function (webResponse: Response | null | undefined) {
    if (!webResponse) {
      serverResponse.end()
      return
    }
    for (const [name, value] of Object.entries(
      transformToOugoingHeaders(
        // @ts-ignore getAll() may not be defined on headers object
        webResponse.headers,
        serverResponse.getHeaders()
      )
    )) {
      serverResponse.setHeader(name, value)
    }

    serverResponse.statusCode = webResponse.status
    serverResponse.statusMessage = webResponse.statusText
    // TODO trailers? https://nodejs.org/api/http.html#responseaddtrailersheaders https://developer.mozilla.org/en-US/docs/Web/API/Response
    if (!webResponse.body) {
      serverResponse.end()
      return
    }
    buildStreamFromReadableStream(webResponse.body).pipe(serverResponse)
  }
}

/**
 * Code adapted from Node's stream.Readable.fromWeb()
 * @see https://github.com/nodejs/node/blob/bd462ad81bc30e547e52e699ee3b6fa3d7c882c9/lib/internal/webstreams/adapters.js#L458
 */
function buildStreamFromReadableStream(readableStream: ReadableStream) {
  const reader = readableStream.getReader()
  let closed = false

  const readable = new Readable({
    objectMode: false,
    read() {
      reader.read().then(
        (chunk: any) => {
          if (chunk.done) {
            readable.push(null)
          } else {
            readable.push(chunk.value)
          }
        },
        (error: any) => readable.destroy(error)
      )
    },

    destroy(error: any, callback: (arg0: any) => void) {
      function done() {
        try {
          callback(error)
        } catch (error) {
          // In a next tick because this is happening within
          // a promise context, and if there are any errors
          // thrown we don't want those to cause an unhandled
          // rejection. Let's just escape the promise and
          // handle it separately.
          process.nextTick(() => {
            throw error
          })
        }
      }

      if (!closed) {
        reader.cancel(error).then(done, done)
        return
      }
      done()
    },
  })

  reader.closed.then(
    () => {
      closed = true
    },
    (error: any) => {
      closed = true
      readable.destroy(error)
    }
  )

  return readable
}
