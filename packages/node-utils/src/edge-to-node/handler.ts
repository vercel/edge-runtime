import type { IncomingMessage, ServerResponse } from 'node:http'
import type {
  WebHandler,
  NodeHandler,
  BuildDependencies,
  RequestOptions,
} from '../types'
import { buildToRequest } from '../node-to-edge/request'
import { mergeIntoServerResponse, toOutgoingHeaders } from './headers'
import { toToReadable } from './stream'

export function buildToNodeHandler(
  dependencies: BuildDependencies,
  options: RequestOptions
) {
  const toRequest = buildToRequest(dependencies)
  return function toNodeHandler(webHandler: WebHandler): NodeHandler {
    return (request: IncomingMessage, response: ServerResponse) => {
      const maybePromise = webHandler(toRequest(request, options))
      if (maybePromise instanceof Promise) {
        maybePromise.then((webResponse) =>
          toServerResponse(webResponse, response)
        )
      } else {
        toServerResponse(maybePromise, response)
      }
    }
  }
}

function toServerResponse(
  webResponse: Response | null | undefined,
  serverResponse: ServerResponse
) {
  if (!webResponse) {
    serverResponse.end()
    return
  }
  mergeIntoServerResponse(
    // @ts-ignore getAll() is not standard https://fetch.spec.whatwg.org/#headers-class
    toOutgoingHeaders(webResponse.headers),
    serverResponse
  )

  serverResponse.statusCode = webResponse.status
  serverResponse.statusMessage = webResponse.statusText
  if (!webResponse.body) {
    serverResponse.end()
    return
  }
  toToReadable(webResponse.body).pipe(serverResponse)
}
