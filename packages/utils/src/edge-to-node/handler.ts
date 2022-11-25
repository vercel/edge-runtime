import type { IncomingMessage, ServerResponse } from 'node:http'
import type { WebHandler, NodeHandler } from '../types'
import { mergeHeadersIntoServerResponse } from './headers'
import { transformToReadable } from './stream'

export function buildTransformer() {
  return function transformToNode(webHandler: WebHandler): NodeHandler {
    return (request: IncomingMessage, response: ServerResponse) => {
      // TODO map incoming message
      // @ts-ignore TODO map IncompingMessage into Request
      const maybePromise = webHandler(request)
      if (maybePromise instanceof Promise) {
        maybePromise.then((webResponse) =>
          mergeToServerResponse(webResponse, response)
        )
      } else {
        mergeToServerResponse(maybePromise, response)
      }
    }
  }
}

function mergeToServerResponse(
  webResponse: Response | null | undefined,
  serverResponse: ServerResponse
) {
  if (!webResponse) {
    serverResponse.end()
    return
  }
  // @ts-ignore getAll() is not standard https://fetch.spec.whatwg.org/#headers-class
  mergeHeadersIntoServerResponse(webResponse.headers, serverResponse)

  serverResponse.statusCode = webResponse.status
  serverResponse.statusMessage = webResponse.statusText
  if (!webResponse.body) {
    serverResponse.end()
    return
  }
  if ('getReader' in webResponse.body) {
    transformToReadable(webResponse.body).pipe(serverResponse)
  } else if ('pipe' in webResponse.body) {
    // @ts-ignore TODO @shniz how could the web response body have a pipe operator?
    webResponse.body.pipe(serverResponse)
  } else {
    serverResponse.end(webResponse.body)
  }
}
