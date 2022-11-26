import type { Server } from 'http'
import type { Socket } from 'net'

/**
 * It takes some time to close the server when it has been invoked with a
 * TransformStream readable side so this function will help closing the
 * server immediately.
 */
export function getKillServer(server: Server) {
  let sockets: Socket[] = []

  server.on('connection', (socket) => {
    sockets.push(socket)
    socket.once('close', () => {
      sockets.splice(sockets.indexOf(socket), 1)
    })
  })

  return () => {
    return new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })

      sockets.forEach(function (socket) {
        socket.destroy()
      })

      // Reset so the server can be restarted
      sockets = []
    })
  }
}
