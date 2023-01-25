import type { IncomingMessage, ServerResponse } from 'http'
import type * as ET from '@edge-runtime/primitives'
import { getKillServer } from './get-kill-server'
import { createServer } from 'http'
import { fetch, URL } from '@edge-runtime/primitives'
import listen from 'test-listen'
interface ServerOptions {
  handler: (
    request: IncomingMessage,
    response: ServerResponse
  ) => Promise<void> | void
  port?: number
}

export interface TestServer {
  close: () => Promise<void>
  fetch: (info: ET.RequestInfo, init?: ET.RequestInit) => Promise<ET.Response>
  url: string
}

export async function runTestServer(
  options: ServerOptions
): Promise<TestServer> {
  const server = createServer((req, res) => {
    try {
      const result = options.handler(req, res)
      if (result?.catch) {
        result.catch((error) => {
          res.statusCode = 500
          res.end(error.toString())
        })
      }
    } catch (error) {
      res.statusCode = 500
      res.end(error?.toString())
    }
  })
  const url = await listen(server)
  return {
    close: getKillServer(server),
    fetch: (info, init) => fetch(String(new URL(String(info), url)), init),
    url,
  }
}
