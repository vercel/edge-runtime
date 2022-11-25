import type { IncomingMessage, ServerResponse } from 'http'
import type { WebHandler, NodeHandler } from '../types'
import { transformToOugoingHeaders } from './headers'
import { transformToReadable } from './stream'

export function transformToNode(webHandler: WebHandler): NodeHandler {
  return (request: IncomingMessage, response: ServerResponse) => {
    // TODO map incoming message
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
    if ('getReader' in webResponse.body) {
      transformToReadable(webResponse.body).pipe(serverResponse)
    } else if ('pipe' in webResponse.body) {
      // @ts-ignore TODO @shniz how could the web response body have a pipe operator?
      webResponse.body.pipe(serverResponse)
    } else {
      serverResponse.end(webResponse.body)
    }
  }
}
