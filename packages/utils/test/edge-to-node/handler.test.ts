import {
  fetch,
  Headers,
  ReadableStream,
  Response,
} from '@edge-runtime/primitives'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { Readable } from 'node:stream'
import { buildTransformer } from '../../src'
import { WebHandler } from '../../src/types'

describe('transformToNode()', () => {
  let server: Server & { destroy?: (done: () => void) => void }

  const transformToNode = buildTransformer()

  afterEach((done) => {
    server.destroy?.(done)
  })

  it('turns null response into an empty request', async () => {
    const response = await invokeWebHandler(() => null)
    expect(response).toMatchObject({
      status: 200,
      statusText: 'OK',
      headers: { 'content-length': '0' },
      text: '',
    })
  })

  it('returns an empty response', async () => {
    const response = await invokeWebHandler(() => new Response(null))
    expect(response).toMatchObject({
      status: 200,
      statusText: 'OK',
      headers: { 'content-length': '0' },
      text: '',
    })
  })

  it('can change response text and status', async () => {
    const response = await invokeWebHandler(
      () => new Response(null, { status: 204, statusText: 'MY STATUS' })
    )
    expect(response).toMatchObject({
      status: 204,
      statusText: 'MY STATUS',
    })
  })

  it('returns a text response', async () => {
    const response = await invokeWebHandler(() => new Response('OK'))
    expect(response).toMatchObject({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'text/plain;charset=UTF-8' },
      text: 'OK',
    })
  })

  it('returns a json response', async () => {
    const json = { works: 'just right' }
    const response = await invokeWebHandler(() => Response.json(json))
    expect(response).toMatchObject({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      json,
    })
  })

  it('returns an async json response', async () => {
    const json = { works: 'just right' }
    const response = await invokeWebHandler(() =>
      Promise.resolve(Response.json(json))
    )
    expect(response).toMatchObject({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      json,
    })
  })

  it('can configure response headers', async () => {
    const response = await invokeWebHandler(() => {
      const response = new Response()
      response.headers.set('x-vercel-custom', '1')
      return response
    })
    expect(response).toMatchObject({
      status: 200,
      headers: { 'x-vercel-custom': '1' },
    })
  })

  it('returns a streams of data', async () => {
    const data = ['lorem', 'ipsum', 'nec', 'mergitur']

    const response = await invokeWebHandler(
      async () =>
        new Response(
          new ReadableStream({
            start(controller) {
              let rank = 0
              function write() {
                controller.enqueue(data[rank++])
                if (rank < data.length) {
                  setTimeout(write, 500)
                } else {
                  controller.close()
                }
              }
              write()
            },
          })
        )
    )
    expect(response).toMatchObject({ status: 200, text: data.join('') })
  })

  it('returns a stream body', async () => {
    const stream = Readable.from(
      (async function* () {
        yield 'hello'
        await new Promise((resolve) => setTimeout(resolve, 200))
        yield ' world'
      })()
    )
    const response = await invokeWebHandler(
      () =>
        ({
          status: 200,
          body: stream,
          headers: new Headers(),
        } as unknown as Response)
    )
    expect(response).toMatchObject({
      status: 200,
      statusText: 'OK',
      text: 'hello world',
    })
  })

  it('returns a buffer body', async () => {
    const text = 'blah'

    const response = await invokeWebHandler(
      () =>
        ({
          status: 200,
          body: Buffer.from(text),
          headers: new Headers(),
        } as unknown as Response)
    )
    expect(response).toMatchObject({ status: 200, statusText: 'OK', text })
  })

  async function invokeWebHandler(handler: WebHandler) {
    // starts a server with provided handler and invokes it
    server = createServer(transformToNode(handler))

    // TODO fetch connections are hanging, despite the lack of keepalive.
    // inspire from https://github.com/isaacs/server-destroy/blob/master/index.js to force-close them.
    const connections = new Map()
    server.on('connection', (connection) => {
      const key = `${connection.remoteAddress}:${connection.remotePort}`
      connections.set(key, connection)
      connection.on('close', () => connections.delete(key))
    })

    server.destroy = (done) => {
      for (const connection of connections.values()) {
        connection.destroy()
      }
      server.close(done)
    }

    await new Promise<void>((resolve, reject) =>
      server.listen((err: any) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    )
    const response = await fetch(
      `http://localhost:${(server?.address() as AddressInfo)?.port}`
    )

    // extract response content to ease expectations
    const headers: Record<string, string> = {}
    for (const [name, value] of await response.headers) {
      headers[name] = value
    }
    return {
      status: response.status,
      statusText: response.statusText,
      headers,
      text: await response.clone().text(),
      json:
        headers['content-type'] === 'application/json'
          ? await response.json()
          : undefined,
    }
  }
})