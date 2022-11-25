import type { IncomingMessage, ServerResponse } from 'node:http'
import type { WebHandler, NodeHandler } from '../types'
import { enrichFromResponse } from './response'

export function transformToNode(webHandler: WebHandler): NodeHandler {
  return (request: IncomingMessage, response: ServerResponse) => {
    // TODO map incoming message
    // @ts-ignore TODO map IncompingMessage into Request
    const maybePromise = webHandler(request)
    if (maybePromise instanceof Promise) {
      maybePromise.then((webResponse) =>
        enrichFromResponse(response, webResponse)
      )
    } else {
      enrichFromResponse(response, maybePromise)
    }
  }
}
