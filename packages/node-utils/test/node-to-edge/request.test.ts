import type { TestServer } from '../test-utils/run-test-server'
import { buildToRequest } from '../../src/node-to-edge/request'
import { runTestServer } from '../test-utils/run-test-server'
import * as EdgeRuntime from '@edge-runtime/primitives'

const nodeRequestToRequest = buildToRequest({
  Headers: EdgeRuntime.Headers,
  ReadableStream: EdgeRuntime.ReadableStream,
  Request: EdgeRuntime.Request,
  Uint8Array: Uint8Array,
  FetchEvent: EdgeRuntime.FetchEvent,
})

let requestMap = new Map<string, Request>()
let server: TestServer

beforeAll(async () => {
  server = await runTestServer({
    handler: async (incoming, response) => {
      const requestId = incoming.headers['x-request-id']
      if (typeof requestId !== 'string') {
        response.writeHead(400)
        response.end(`Invalid Request Id.`)
        return
      }

      const request = nodeRequestToRequest(incoming, {
        defaultOrigin: server.url,
      })
      const [body, readable] = request.body?.tee() ?? []
      requestMap.set(requestId, new EdgeRuntime.Request(request, { body }))
      response.writeHead(200, { 'Content-Type': 'text/plain' })

      /**
       * We respond right away so we can start consuming the body stream in
       * the test before it has been completely sent, but we still need to
       * consume the body before completing the server response otherwise
       * the socket gets closed and we don't get the full body.
       */
      const reader = readable?.getReader()
      if (reader) {
        while (true) {
          const { done } = await reader?.read()
          if (done) break
        }
      }

      response.end()
    },
  })
})

afterAll(() => {
  return server.close()
})

it('maps the request input', async () => {
  const input = `${server.url}/hi/there?=foo&bar=baz`
  const request = await mapRequest(input)
  expect(request.url).toEqual(input)
})

it('maps the request headers`', async () => {
  const headers = new EdgeRuntime.Headers({ 'x-hi': 'there' })
  headers.append('vercel-is-awesome', 'true')
  headers.append('vercel-is-awesome', 'you damn right')
  const request = await mapRequest(server.url, { headers })
  expect(request?.headers.get('connection')).toEqual('keep-alive')
  expect(request?.headers.get('user-agent')).toEqual('undici')
  expect(request?.headers.get('x-hi')).toEqual(headers.get('x-hi'))
  expect(request?.headers.get('vercel-is-awesome')).toEqual(
    headers.get('vercel-is-awesome')
  )
})

it(`uses default origin as request url origin when there are no host header`, async () => {
  const request = await mapRequest(server.url)
  expect(request.url).toEqual(`${server.url}/`)
})

it(`uses request host header as request url origin`, async () => {
  const host = 'vercel.com'
  await expect(
    mapRequest(server.url, { headers: { host } })
  ).resolves.toHaveProperty('url', `http://${host}/`)
  await expect(
    mapRequest(server.url, { headers: { host: `${host}:6000` } })
  ).resolves.toHaveProperty('url', `http://${host}:6000/`)
  await expect(
    mapRequest(server.url, { headers: { host: `${host}:443` } })
  ).resolves.toHaveProperty('url', `https://${host}/`)
})

it('allows to read the body as text', async () => {
  const request = await mapRequest(server.url, {
    body: 'Hello World',
    method: 'POST',
  })

  expect(request.method).toEqual('POST')
  expect(await request.text()).toEqual('Hello World')
})

it('allows to read the body as chunks', async () => {
  const encoder = new EdgeRuntime.TextEncoder()
  const body = new EdgeRuntime.ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode('Hello '))
      setTimeout(() => {
        controller.enqueue(encoder.encode('World'))
        controller.close()
      }, 500)
    },
  })

  const request = await mapRequest(server.url, {
    method: 'POST',
    body,
  })

  expect(request.method).toEqual('POST')
  expect(await request.text()).toEqual('Hello World')
})

it('does not allow to read the body twice', async () => {
  const request = await mapRequest(server.url, {
    body: 'Hello World',
    method: 'POST',
  })

  expect(request.method).toEqual('POST')
  expect(await request.text()).toEqual('Hello World')
  await expect(request.text()).rejects.toThrowError('The body has already been consumed.')
})

async function mapRequest(input: string, init: RequestInit = {}) {
  const requestId = EdgeRuntime.crypto.randomUUID()
  const headers = new EdgeRuntime.Headers(init.headers)
  headers.set('x-request-id', requestId)
  const response = await EdgeRuntime.fetch(input, { ...init, headers })
  const request = requestMap.get(requestId)
  expect(response.status).toEqual(200)
  expect(request).not.toBeUndefined()
  return request!
}
