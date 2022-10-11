import type { EdgeRuntime as IEdgeRuntime } from '../src/edge-runtime'

const handlerByEvent = new Map<string, Function>()

let EdgeRuntime: typeof IEdgeRuntime

beforeAll(async () => {
  jest
    .spyOn(process, 'on')
    .mockImplementation((event: string, handler: Function) => {
      handlerByEvent.set(event, handler)
      return process
    })
  ;({ EdgeRuntime } = await import('../src/edge-runtime'))
})

test("don't expose servers headers", async () => {
  const runtime = new EdgeRuntime()

  runtime.evaluate(`
    addEventListener("fetch", (event) => {
      event.respondWith(new Response('success', {
        headers: {
          'content-encoding': 'gzip',
          'transform-encoding': 'compress',
          'content-length': 7
        }
      }))
    })
  `)

  const res = await runtime.dispatchFetch('https://localhost.com')
  expect(res.status).toBe(200)
  expect(await res.text()).toBe('success')
  expect(Array.from(res.headers)).toEqual([
    ['content-type', 'text/plain;charset=UTF-8'],
  ])
})

test("don't expose servers headers in a redirect", async () => {
  const runtime = new EdgeRuntime()

  runtime.evaluate(`
    addEventListener("fetch", (event) => {
      event.respondWith(Response.redirect(new URL('https://example.vercel.sh')));
    })
  `)

  const res = await runtime.dispatchFetch('https://localhost.com')

  expect(Array.from(res.headers)).toEqual([
    ['location', 'https://example.vercel.sh/'],
  ])
  expect(res.status).toBe(302)
})

test('allows to add FetchEvent handlers', async () => {
  const runtime = new EdgeRuntime()

  runtime.evaluate(`
    addEventListener("fetch", (event) => {
      event.respondWith(new Response('Hi there!'));
    })
  `)

  const res = await runtime.dispatchFetch('https://localhost.com')
  const text = await res.text()
  expect(text).toEqual('Hi there!')
})

test('does not allow to define more than one FetchEvent handler', async () => {
  const runtime = new EdgeRuntime()
  runtime.evaluate(`
    addEventListener("fetch", (event) => {
      event.respondWith(new Response('Hi there!'));
    });
  `)

  expect(() => {
    runtime.evaluate(`
        addEventListener("fetch", (event) => {
          event.respondWith(new Response('Hi there!'));
        })
      `)
  }).toThrow({
    name: 'TypeError',
    message: 'You can register just one "fetch" event listener',
  })
})

test('allows to add/remove unhandledrejection event handlers', async () => {
  const runtime = new EdgeRuntime()
  runtime.context.unhandled = jest.fn()
  runtime.evaluate(`addEventListener("unhandledrejection", self.unhandled)`)
  expect((runtime as any).__rejectionHandlers).toHaveLength(1)
  runtime.evaluate(`removeEventListener("unhandledrejection", self.unhandled)`)
  expect((runtime as any).__rejectionHandlers).toBeUndefined()
})

test('invokes context rejection handler', async () => {
  const runtime = new EdgeRuntime()

  const handleRejection = jest.fn()
  const reason = new Error('Boom!!!')
  const promise = Promise.resolve()
  runtime.context.addEventListener('unhandledrejection', handleRejection)

  expect(handlerByEvent.get('unhandledRejection')).toBeDefined()
  handlerByEvent.get('unhandledRejection')!(reason, promise)
  expect(handleRejection).toHaveBeenCalledWith({ reason, promise })
  expect(handleRejection).toHaveBeenCalledTimes(1)
})

test('allows to add/remove error event handlers', async () => {
  const runtime = new EdgeRuntime()
  runtime.context.uncaught = jest.fn()
  runtime.evaluate(`addEventListener("error", self.uncaught)`)
  expect((runtime as any).__errorHandlers).toHaveLength(1)
  runtime.evaluate(`removeEventListener("error", self.uncaught)`)
  expect((runtime as any).__errorHandlers).toBeUndefined()
})

test('invokes context error handler', async () => {
  const runtime = new EdgeRuntime()

  const handleError = jest.fn()
  const error = new Error('Boom!!!')
  runtime.context.addEventListener('error', handleError)

  expect(handlerByEvent.get('uncaughtException')).toBeDefined()
  handlerByEvent.get('uncaughtException')!(error)
  expect(handleError).toHaveBeenCalledWith(error)
  expect(handleError).toHaveBeenCalledTimes(1)
})

test('interact with worker context', async () => {
  const runtime = new EdgeRuntime()
  runtime.evaluate(`
    addEventListener('fetch', event => {
      const { searchParams } = new URL(event.request.url)
      const url = searchParams.get('url') || 'https://edge-ping.vercel.app'
      return event.respondWith(fetch(url))
    })
  `)

  expect(runtime.dispatchFetch).toBeTruthy()

  const r1 = await runtime.dispatchFetch('https://edge-ping.vercel.app')
  expect(r1).toBeInstanceOf(runtime.context.Response)
  expect(r1.statusText).toEqual('OK')

  const r2 = await runtime.dispatchFetch('https://edge-ping.vercel.app')
  expect(r2).toBeInstanceOf(runtime.context.Response)
  expect(r2.statusText).toEqual('OK')
})

test('re-use module caching', async () => {
  const runtime = new EdgeRuntime()
  runtime.evaluate(`
    let count = 0
    addEventListener('fetch', event => {
      return event.respondWith(new Response(++count))
    })
  `)

  const r1 = await runtime.dispatchFetch('https://edge-ping.vercel.app')
  expect(await r1.text()).toEqual('1')

  const r2 = await runtime.dispatchFetch('https://edge-ping.vercel.app')
  expect(await r2.text()).toEqual('2')
})

test('wait until promises are done', async () => {
  const runtime = new EdgeRuntime({
    initialCode: `
      const delay = ms => new Promise(resolve => {
        setTimeout(() => resolve(ms), ms)
      });

      addEventListener('fetch', (event) => {
        event.waitUntil(Promise.resolve(delay(50)))
        event.waitUntil(Promise.resolve(delay(500)))
        event.respondWith(new Response())
      });
    `,
  })

  const res = await runtime.dispatchFetch('https://edge-ping.vercel.app')
  expect(res.waitUntil).toBeTruthy()

  const promises = await res.waitUntil()
  expect(promises).toEqual([50, 500])
})

test('gets a server error under error', async () => {
  const runtime = new EdgeRuntime()
  runtime.evaluate(`
    addEventListener('fetch', event => {
      return Promise.reject(new Error('Oh no!'))
    });
  `)

  const res = await runtime.dispatchFetch('https://edge-ping.vercel.app')
  expect(res.statusText).toEqual('Internal Server Error')
  expect(res.status).toEqual(500)
})

test('gets a server error when not responding', async () => {
  const runtime = new EdgeRuntime()
  runtime.evaluate(`
    addEventListener('fetch', event => {
      return 'This should fail'
    });
  `)

  const res = await runtime.dispatchFetch('https://edge-ping.vercel.app')
  expect(res.statusText).toEqual('Internal Server Error')
  expect(res.status).toEqual(500)
})

test('gets a server error when responding with no response', async () => {
  const runtime = new EdgeRuntime()
  runtime.evaluate(`
    addEventListener('fetch', event => {
      return event.respondWith('This should fail')
    });
  `)

  const res = await runtime.dispatchFetch('https://edge-ping.vercel.app')
  expect(res.statusText).toEqual('Internal Server Error')
  expect(res.status).toEqual(500)
})

test('gets the runtime version in a hidden propety', async () => {
  const runtime = new EdgeRuntime()
  {
    const meta = runtime.evaluate(`(globalThis.EdgeRuntime)`)
    expect(meta).toEqual('edge-runtime')
  }
  {
    const meta = runtime.evaluate(`(EdgeRuntime)`)
    expect(meta).toEqual('edge-runtime')
  }
  const keys = runtime.evaluate<string[]>(`(Object.keys(globalThis))`)
  expect(keys).not.toHaveLength(0)
  expect(keys).not.toContain('EdgeRuntime')
})
