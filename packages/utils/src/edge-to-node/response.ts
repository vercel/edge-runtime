import { Response } from '@edge-runtime/primitives'
import { ServerResponse } from 'node:http'
import { transformToOugoingHeaders } from './headers'
import { transformToReadable } from './stream'

export function enrichFromResponse(
  serverResponse: ServerResponse,
  webResponse: Response | null | undefined
) {
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
    if (value !== undefined) {
      serverResponse.setHeader(name, value)
    }
  }

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
