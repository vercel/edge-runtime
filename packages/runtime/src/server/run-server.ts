import { createHandler, Options } from './create-handler'
import type { EdgeContext } from '@edge-runtime/vm'
import listen from 'async-listen'
import http from 'http'
import type { ListenOptions } from 'net'
import { promisify } from 'util'

interface ServerOptions<T extends EdgeContext> extends Options<T> {}

export interface EdgeRuntimeServer {
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
  options: ListenOptions & ServerOptions<T>,
): Promise<EdgeRuntimeServer> {
  if (options.port === undefined) options.port = 0
  const { handler, waitUntil } = createHandler(options)
  const server = http.createServer(handler)
  const url = await listen(server, options)
  const closeServer = promisify(server.close.bind(server))
  return {
    url: String(url),
    close: () => Promise.all([waitUntil(), closeServer()]).then(() => void 0),
    waitUntil,
  }
}
