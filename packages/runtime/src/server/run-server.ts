import type { EdgeContext } from '@edge-runtime/vm'
import { createHandler, Options } from './create-handler'
import { once } from 'events'
import http from 'http'

interface ServerOptions<T extends EdgeContext> extends Options<T> {
  /**
   * The port to start the server. If none is provided it will use a random
   * available port.
   */
  port?: number
}

interface EdgeRuntimeServer {
  /**
   * The server URL.
   */
  url: string
  /**
   * Waits for all the current effects and closes the server.
   */
  close: () => Promise<void>
  /**
   * Waits for all current effects returning their result.
   */
  waitUntil: () => Promise<any[]>
}

/**
 * This helper will create a handler based on the given options and then
 * immediately run a server on the provided port. If there is no port, the
 * server will use a random one.
 */
export async function runServer<T extends EdgeContext>(
  options: ServerOptions<T>
): Promise<EdgeRuntimeServer> {
  const { handler, waitUntil } = createHandler(options)
  const server = http.createServer(handler)
  server.listen(options.port)

  try {
    await once(server, 'listening')
  } catch (error: any) {
    if (error?.code === 'EADDRINUSE') {
      return runServer({ ...options, port: undefined })
    }
    throw error
  }

  const address = server.address()
  const url =
    typeof address === 'string' || address == null
      ? String(address)
      : `http://localhost:${address.port}`

  return {
    url,
    close: async () => {
      await waitUntil()
      await new Promise<void>((resolve, reject) => {
        return server.close((err) => {
          if (err) reject(err)
          resolve()
        })
      })
    },
    waitUntil,
  }
}
