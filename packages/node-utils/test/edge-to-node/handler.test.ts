import type { TestServer } from '../test-utils/run-test-server'
import { buildToNodeHandler } from '../../src/edge-to-node/handler'
import { runTestServer } from '../test-utils/run-test-server'
import { serializeResponse } from '../test-utils/serialize-response'
import * as Edge from '@edge-runtime/primitives'

const transformToNode = buildToNodeHandler(
  {
    Headers: Edge.Headers,
    ReadableStream: Edge.ReadableStream,
    Request: Edge.Request,
    Uint8Array: Uint8Array,
    FetchEvent: Edge.FetchEvent,
  },
  { defaultOrigin: 'http://example.com' }
)

let server: TestServer

afterEach(() => {
  return server.close()
})

it('turns null response into an empty request', async () => {
  server = await runTestServer({
    handler: transformToNode(() => null),
  })

  const response = await server.fetch('/')
  expect(await serializeResponse(response)).toMatchObject({
    headers: { 'content-length': '0' },
    status: 200,
    statusText: 'OK',
    text: '',
  })
})

it('returns an empty response', async () => {
  server = await runTestServer({
    handler: transformToNode(() => new Edge.Response(null)),
  })

  const response = await server.fetch('/')
  expect(await serializeResponse(response)).toMatchObject({
    headers: { 'content-length': '0' },
    status: 200,
    statusText: 'OK',
    text: '',
  })
})

it('can change response text and status', async () => {
  server = await runTestServer({
    handler: transformToNode(
      () => new Edge.Response(null, { status: 204, statusText: 'MY STATUS' })
    ),
  })

  const response = await server.fetch('/')
  expect(await serializeResponse(response)).toMatchObject({
    status: 204,
    statusText: 'MY STATUS',
  })
})

it('returns a text response', async () => {
  server = await runTestServer({
    handler: transformToNode(() => new Edge.Response('OK')),
  })

  const response = await server.fetch('/')
  expect(await serializeResponse(response)).toMatchObject({
    headers: { 'content-type': 'text/plain;charset=UTF-8' },
    status: 200,
    statusText: 'OK',
    text: 'OK',
  })
})

it('returns a json response', async () => {
  const json = { works: 'just right' }
  server = await runTestServer({
    handler: transformToNode(() => Edge.Response.json(json)),
  })

  const response = await server.fetch('/')
  expect(await serializeResponse(response)).toMatchObject({
    headers: { 'content-type': 'application/json' },
    json,
    status: 200,
    statusText: 'OK',
  })
})

it('returns an async json response', async () => {
  const json = { works: 'just right' }
  server = await runTestServer({
    handler: transformToNode(() => Promise.resolve(Edge.Response.json(json))),
  })

  const response = await server.fetch('/')
  expect(await serializeResponse(response)).toMatchObject({
    headers: { 'content-type': 'application/json' },
    json,
    status: 200,
    statusText: 'OK',
  })
})

it('can configure response headers', async () => {
  server = await runTestServer({
    handler: transformToNode(() => {
      const response = new Edge.Response()
      response.headers.set('x-vercel-custom', '1')
      return response
    }),
  })

  const response = await server.fetch('/')
  expect(await serializeResponse(response)).toMatchObject({
    headers: { 'x-vercel-custom': '1' },
    status: 200,
  })
})

it('returns a streams of data', async () => {
  const data = ['lorem', 'ipsum', 'nec', 'mergitur']
  const encoder = new Edge.TextEncoder()
  server = await runTestServer({
    handler: transformToNode(
      () =>
        new Edge.Response(
          new Edge.ReadableStream({
            start(controller) {
              let rank = 0
              function write() {
                controller.enqueue(encoder.encode(data[rank++]))
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
    ),
  })

  const response = await server.fetch('/')
  expect(await serializeResponse(response)).toMatchObject({
    status: 200,
    text: data.join(''),
  })
})

it('returns a stream body', async () => {
  const encoder = new Edge.TextEncoder()
  const stream = new Edge.ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('hello'))
      setTimeout(() => {
        controller.enqueue(encoder.encode(' world'))
        controller.close()
      })
    },
  })

  server = await runTestServer({
    handler: transformToNode(() => new Edge.Response(stream, { status: 200 })),
  })

  const response = await server.fetch('/')
  expect(await serializeResponse(response)).toMatchObject({
    status: 200,
    statusText: 'OK',
    text: 'hello world',
  })
})

it('returns a buffer body', async () => {
  const text = 'blah'
  const encoder = new Edge.TextEncoder()
  server = await runTestServer({
    handler: transformToNode(() => {
      return new Edge.Response(encoder.encode(text), {
        status: 200,
      })
    }),
  })

  const response = await server.fetch('/')
  expect(await serializeResponse(response)).toMatchObject({
    status: 200,
    statusText: 'OK',
    text,
  })
})

it('consumes incoming request body', async () => {
  const body = 'hello world'
  server = await runTestServer({
    handler: transformToNode((req) => new Edge.Response(req.body)),
  })

  const response = await server.fetch('/', { method: 'POST', body })
  expect(await serializeResponse(response)).toMatchObject({
    status: 200,
    statusText: 'OK',
    text: body,
  })
})

it('consumes incoming headers', async () => {
  const headers = {
    'x-custom-header': 'foo',
    'x-another-header': 'bar',
  }
  server = await runTestServer({
    handler: transformToNode(
      (req) => new Edge.Response(null, { headers: req.headers })
    ),
  })

  const response = await server.fetch('/', { headers })
  expect(await serializeResponse(response)).toMatchObject({
    status: 200,
    statusText: 'OK',
    headers,
  })
})

it('fails when using waitUntil()', async () => {
  server = await runTestServer({
    handler: transformToNode((req, evt) => {
      evt.waitUntil(Promise.resolve())
      return new Edge.Response('ok')
    }),
  })

  const response = await server.fetch('/')
  expect(await serializeResponse(response)).toMatchObject({
    status: 500,
    statusText: 'Internal Server Error',
    text: 'Error: waitUntil is not supported yet.',
  })
})
