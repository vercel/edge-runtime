import { EdgeRuntime } from '../src/edge-runtime'
import { runServer } from '../src/server'
import fetch from 'node-fetch'
import type { Readable } from 'stream'

let server: Awaited<ReturnType<typeof runServer>>

afterEach(() => {
  server.close()
})

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

test('starts an http server', async () => {
  const runtime = new EdgeRuntime()
  runtime.evaluate(`
    addEventListener('fetch', event => {
      return event.respondWith(new Response(null))
    });
  `)

  server = await runServer({ runtime, host: '127.0.0.1', port: 3000 })
  expect(server.url).toEqual('http://127.0.0.1:3000/')
})

test('run fetch events through http', async () => {
  const runtime = new EdgeRuntime()
  runtime.evaluate(`
    addEventListener('fetch', event => {
      const { searchParams } = new URL(event.request.url)
      const url = searchParams.get('url')
      return event.respondWith(fetch(url))
    })
  `)

  server = await runServer({ runtime })
  const url = new URL(server.url)
  url.searchParams.set('url', 'https://edge-ping.vercel.app')
  const response = await fetch(String(url))

  expect(response).toBeTruthy()
  expect(response.statusText).toEqual('OK')
})

test('works with cookies header', async () => {
  const runtime = new EdgeRuntime()
  runtime.evaluate(`
    addEventListener('fetch', event => {
      const headers = new Headers()
      headers.append('set-cookie', 'foo=chocochip')
      headers.append('set-cookie', 'bar=chocochip')
      return event.respondWith(new Response(null, { headers }))
    })
  `)

  server = await runServer({ runtime })
  const url = new URL(server.url)
  url.searchParams.set('url', 'https://edge-ping.vercel.app')
  const response = await fetch(String(url))

  const cookies = response.headers.get('set-cookie')
  expect(cookies).toEqual('foo=chocochip, bar=chocochip')
})

test('works with json', async () => {
  const runtime = new EdgeRuntime()
  runtime.evaluate(`
    addEventListener('fetch', event => {
      return event.respondWith(
        new Response(JSON.stringify({ "message": "hi!" }), {
          headers: { 'content-type': 'application/json' }
        })
      )
    })
  `)

  server = await runServer({ runtime })
  const response = await fetch(server.url)
  const content = await response.json()

  expect(response).toBeTruthy()
  expect(response.statusText).toEqual('OK')
  expect(content).toStrictEqual({ message: 'hi!' })
})

test('responds with an error when the code fails', async () => {
  const runtime = new EdgeRuntime()
  runtime.evaluate(`
    async function handleRequest() {
      throw new Error('Boom');
    }

    addEventListener('fetch', event => {
      return event.respondWith(
        handleRequest(event)
      )
    })
  `)

  server = await runServer({ runtime })
  const response = await fetch(server.url)
  expect(response).toBeTruthy()
  expect(response.status).toEqual(500)
})

test('works with POST HTTP method', async () => {
  const runtime = new EdgeRuntime()
  runtime.evaluate(`
    async function handleRequest (event) {
      const body = await event.request.json()
      return new Response(JSON.stringify({ body }), {
        headers: { 'content-type': 'application/json' }
      })
    }

    addEventListener('fetch', event => {
      return event.respondWith(
        handleRequest(event)
      )
    })
  `)

  server = await runServer({ runtime })
  const body = { greeting: 'hello' }
  const response = await fetch(server.url, {
    body: JSON.stringify(body),
    method: 'POST',
  })

  const content = await response.json()

  expect(response).toBeTruthy()
  expect(response.statusText).toEqual('OK')
  expect(content).toStrictEqual({ body })
})

test('allows to wait for effects created with waitUntil', async () => {
  const runtime = new EdgeRuntime()
  runtime.evaluate(`
    async function doAsyncStuff (event) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return 'done';
    }

    addEventListener('fetch', event => {
      event.waitUntil(doAsyncStuff());
      return event.respondWith(
        new Response('hi there')
      )
    })
  `)

  server = await runServer({ runtime })
  const response = await fetch(server.url)
  const [resolved] = await server.waitUntil()

  expect(response).toBeTruthy()
  expect(response.status).toEqual(200)
  expect(resolved).toContain('done')
})

test(`do not fail writing to the response socket Uint8Array`, async () => {
  const runtime = new EdgeRuntime()
  runtime.evaluate(`
    addEventListener('fetch', event => {
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode('hi there1\\n'));
          controller.enqueue(encoder.encode('hi there2\\n'));
          controller.enqueue(encoder.encode('hi there3\\n'));
          controller.close();
        }
      });
      return event.respondWith(
        new Response(stream, {
          status: 200,
        })
      )
    })
  `)
  server = await runServer({ runtime })
  const response = await fetch(server.url)
  expect(response.status).toEqual(200)
  const text = await response.text()
  expect(text).toEqual('hi there1\nhi there2\nhi there3\n')
})

test('streamable sanity test', async () => {
  const runtime = new EdgeRuntime()
  runtime.evaluate(`
    addEventListener('fetch', event => {
      let i = 0;
      const encoder = new TextEncoder();

      return event.respondWith(new Response(new ReadableStream({
        async pull(controller) {
          if (i === 10) {
            controller.close()
          } else {
            controller.enqueue(encoder.encode(i++));
          }
        }
      })));
    })
  `)

  server = await runServer({ runtime })

  const response = await fetch(server.url)
  let data = ''

  for await (const chunk of response.body) {
    data += chunk.toString()
  }

  expect(response).toBeTruthy()
  expect(response.status).toEqual(200)
  expect(data).toContain('9')
})

test('allows long-running streams to be cancelled immediately', async () => {
  const runtime = new EdgeRuntime()

  const pulled = (runtime.context.pulled = [])
  runtime.evaluate(`
    addEventListener('fetch', event => {
      let i = 0;

      return event.respondWith(new Response(new ReadableStream({
        async pull(controller) {
          self.pulled.push(i);
          if (i === 10) {
            throw new Error('stream still connected: allows long-running streams to be cancelled immediately');
          }
          const chunk = new Uint8Array(1024 * 1024).fill('0'.charCodeAt(0) + i);
          controller.enqueue(chunk);
          i++;
        }
      })));
    })
  `)

  server = await runServer({ runtime })

  const controller = new AbortController()
  const response = await fetch(server.url, {
    signal: controller.signal as any,
  })

  // There's a bug in pre-v3 node-fetch where aborting the fetch will never end
  // end the async-iteration.
  response.body.on('error', (e) => (response.body as Readable).destroy(e))

  try {
    controller.abort()
  } catch (e) {
    // Swallow the AbortError, but throw anything else.
    if ((e as Error).name !== 'AbortError') throw e
  }
  await sleep(10)

  expect(response).toBeTruthy()
  // The error happens _after_ we begin streaming data, so this should still be
  // a 200 response.
  expect(response.status).toEqual(200)

  // Because the client and server are in the same node process, if the server
  // doesn't pause then it will have pulled all 10 iterations immediately.
  expect(pulled).not.toContain(10)
})

test('allows long-running streams to be cancelled after partial read', async () => {
  const runtime = new EdgeRuntime()

  const pulled = (runtime.context.pulled = [])
  runtime.evaluate(`
    addEventListener('fetch', event => {
      let i = 0;

      return event.respondWith(new Response(new ReadableStream({
        async pull(controller) {
          self.pulled.push(i);
          if (i === 10) {
            throw new Error('stream still connected: allows long-running streams to be cancelled immediately');
          }
          const chunk = new Uint8Array(1024 * 1024).fill('0'.charCodeAt(0) + i);
          controller.enqueue(chunk);
          i++;
        }
      })));
    })
  `)

  server = await runServer({ runtime })

  const controller = new AbortController()
  const response = await fetch(server.url, {
    signal: controller.signal as any,
  })

  // There's a bug in pre-v3 node-fetch where aborting the fetch will never end
  // end the async-iteration.
  response.body.on('error', (e) => (response.body as Readable).destroy(e))

  // Read a few chunks so we can pause in the middle of the stream.
  for await (const _ of response.body) {
    break
  }

  try {
    controller.abort()
  } catch (e) {
    // Swallow the AbortError, but throw anything else.
    if ((e as Error).name !== 'AbortError') throw e
  }
  await sleep(10)

  // Because the client and server are in the same node process, if the server
  // doesn't pause then it will have pulled all 10 iterations immediately.
  expect(pulled).not.toContain(10)
})
