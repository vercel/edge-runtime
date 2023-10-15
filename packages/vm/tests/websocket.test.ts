import http from 'http'
import { EdgeVM } from '../src'
import { WebSocketServer, type WebSocket as Socket } from 'ws'
import { promisify } from 'util'

test(`makes a WebSocket connection`, async () => {
  const vm = new EdgeVM()

  const websocketServer = createWebsocketServer((socket) => {
    socket.on('message', (data) => {
      socket.send(`pong: ${data.toString()}`)
    })
  })

  async function userCode(url: string) {
    const client = new WebSocket(url)
    return await new Promise<string>((resolve, reject) => {
      client.onopen = () => {
        client.send('ping')
      }
      client.addEventListener('message', (msg) => {
        resolve(String(msg.data))
      })
      client.onerror = (err) => reject(err)
    }).finally(() => client.close())
  }

  try {
    const v: Awaited<ReturnType<typeof userCode>> = await vm.evaluate(
      `(${userCode})(${JSON.stringify(websocketServer.url)})`,
    )
    expect(v).toBe(`pong: ping`)
  } finally {
    await websocketServer.close()
  }
})

function createWebsocketServer(callback: (ws: Socket) => void): {
  url: string
  close(): Promise<void>
} {
  const server = http.createServer()
  const websocketServer = new WebSocketServer({ server })

  websocketServer.on('connection', (socket) => {
    return callback(socket)
  })

  server.listen(0)

  const port = (server.address() as { port: number }).port
  const url = `ws://localhost:${port}`

  const closeServer = promisify(server.close.bind(server))
  const closeWebsocketServer = promisify(
    websocketServer.close.bind(websocketServer),
  )

  return {
    url,
    async close() {
      await Promise.all([closeServer(), closeWebsocketServer()])
    },
  }
}
