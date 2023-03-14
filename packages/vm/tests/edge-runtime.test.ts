import type { EdgeVM as IEdgeRuntime } from '../src/edge-vm'

const handlerByEvent = new Map<string | symbol, Function>()

let EdgeVM: typeof IEdgeRuntime

beforeAll(async () => {
  jest.spyOn(process, 'on').mockImplementation((event, handler) => {
    handlerByEvent.set(event, handler)
    return process
  })
  // Run the import after patching the implementation of process.on
  ;({ EdgeVM } = await import('../src/edge-vm'))
})

describe('Global primitives', () => {
  let runtime: IEdgeRuntime

  beforeAll(() => {
    runtime = new EdgeVM()
  })

  it('EdgeRuntime', async () => {
    const runtime = new EdgeVM()
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

  it.each([
    { api: 'AbortController' },
    { api: 'AbortSignal' },
    { api: 'Array' },
    { api: 'ArrayBuffer' },
    { api: 'atob' },
    { api: 'Atomics' },
    { api: 'BigInt' },
    { api: 'BigInt64Array' },
    { api: 'BigUint64Array' },
    { api: 'Blob' },
    { api: 'Boolean' },
    { api: 'btoa' },
    { api: 'clearInterval' },
    { api: 'clearTimeout' },
    { api: 'console' },
    { api: 'console' },
    { api: 'crypto' },
    { api: 'crypto' },
    { api: 'Crypto' },
    { api: 'CryptoKey' },
    { api: 'DataView' },
    { api: 'Date' },
    { api: 'decodeURI' },
    { api: 'decodeURIComponent' },
    { api: 'DOMException' },
    { api: 'encodeURI' },
    { api: 'encodeURIComponent' },
    { api: 'Error' },
    { api: 'Error' },
    { api: 'escape' },
    { api: 'eval' },
    { api: 'EvalError' },
    { api: 'EvalError' },
    { api: 'Event' },
    { api: 'Event' },
    { api: 'EventTarget' },
    { api: 'fetch' },
    { api: 'FetchEvent' },
    { api: 'File' },
    { api: 'Float32Array' },
    { api: 'Float64Array' },
    { api: 'FormData' },
    { api: 'Function' },
    { api: 'globalThis' },
    { api: 'Headers' },
    { api: 'Infinity' },
    { api: 'Int8Array' },
    { api: 'Int16Array' },
    { api: 'Int32Array' },
    { api: 'Intl' },
    { api: 'isFinite' },
    { api: 'isNaN' },
    { api: 'JSON' },
    { api: 'Map' },
    { api: 'Math' },
    { api: 'NaN' },
    { api: 'Number' },
    { api: 'Object' },
    { api: 'parseFloat' },
    { api: 'parseInt' },
    { api: 'Promise' },
    { api: 'PromiseRejectionEvent' },
    { api: 'Proxy' },
    { api: 'RangeError' },
    { api: 'ReadableStream' },
    { api: 'ReadableStreamBYOBReader' },
    { api: 'ReadableStreamDefaultReader' },
    { api: 'ReferenceError' },
    { api: 'Reflect' },
    { api: 'RegExp' },
    { api: 'Request' },
    { api: 'Response' },
    { api: 'self' },
    { api: 'Set' },
    { api: 'setInterval' },
    { api: 'setTimeout' },
    { api: 'SharedArrayBuffer' },
    { api: 'String' },
    { api: 'structuredClone' },
    { api: 'SubtleCrypto' },
    { api: 'Symbol' },
    { api: 'SyntaxError' },
    { api: 'TextDecoder' },
    { api: 'TextDecoderStream' },
    { api: 'TextEncoder' },
    { api: 'TextEncoderStream' },
    { api: 'TransformStream' },
    { api: 'TypeError' },
    { api: 'Uint8Array' },
    { api: 'Uint8ClampedArray' },
    { api: 'Uint16Array' },
    { api: 'Uint32Array' },
    { api: 'unescape' },
    { api: 'URIError' },
    { api: 'URL' },
    { api: 'URLPattern' },
    { api: 'URLSearchParams' },
    { api: 'WeakMap' },
    { api: 'WeakSet' },
    { api: 'WebAssembly' },
    { api: 'WritableStream' },
    { api: 'WritableStreamDefaultWriter' },
  ])('`$api` is defined in global scope', ({ api }) => {
    expect(runtime.evaluate(api)).toBeDefined()
  })
})
describe('General behaviour', () => {
  it('reuses module caching across `dispatchFetch` invocations', async () => {
    const runtime = new EdgeVM()
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

  it('allows to override predefined primitives', async () => {
    const edgeVM = new EdgeVM({
      extend: (context) => {
        const rawFetch = context.fetch.bind(context.fetch) as typeof fetch
        context.fetch = async (input: RequestInfo | URL, init?: RequestInit) =>
          rawFetch(
            typeof input === 'string' && !input.startsWith('https://')
              ? `https://${input}`
              : String(input),
            init
          )

        return context
      },
    })

    const promises = await Promise.all([
      edgeVM.evaluate<Promise<Response>>("fetch('edge-ping.vercel.app')"),
      edgeVM.evaluate<Promise<Response>>(
        "globalThis.fetch('edge-ping.vercel.app')"
      ),
    ])

    promises.forEach(({ url, status }) => {
      expect(url).toEqual('https://edge-ping.vercel.app/')
      expect(status).toEqual(200)
    })
  })
})

describe('Behaviour of some pre-defined APIs', () => {
  describe('`fetch`', () => {
    it('works when parsing a response as text', async () => {
      const html = await new EdgeVM().evaluate(
        `fetch('https://example.vercel.sh').then(res => res.text())`
      )
      expect(html.startsWith('<!doctype html>')).toBe(true)
    })

    it('works when using the `Headers` global primitive', async () => {
      const edgeVM = new EdgeVM()
      edgeVM.evaluate('this.headers = new Headers()')
      edgeVM.evaluate(
        "this.request = new Request('https://edge-ping.vercel.app', { headers: new Headers({ 'Content-Type': 'text/xml' }) })"
      )

      expect(edgeVM.context.headers).toBeTruthy()
      expect(edgeVM.context.request).toBeTruthy()
      expect(edgeVM.context.request.headers.get('Content-Type')).toEqual(
        'text/xml'
      )
    })

    it('works when using `AbortController`', async () => {
      const promise = new EdgeVM().evaluate(`
      const controller = new AbortController();
      controller.abort();
      fetch('https://example.vercel.sh', {
        signal: controller.signal,
      });
      `)

      await expect(promise).rejects.toThrowError('The operation was aborted.')
    })

    it('allows to run within the VM reading outside of it', async () => {
      const edgeVM = new EdgeVM()
      const promise = edgeVM.evaluate<Promise<Response>>(
        "fetch('https://edge-ping.vercel.app')"
      )

      expect(promise).toBeTruthy()
      const { url, status } = await promise

      expect(url).toEqual('https://edge-ping.vercel.app/')
      expect(status).toEqual(200)
    })
  })

  describe('`TextDecoder`', () => {
    it('works when using Uint8Array', () => {
      const edgeVM = new EdgeVM()
      edgeVM.evaluate(
        "this.decode = new TextDecoder('utf-8', { ignoreBOM: true }).decode(new Uint8Array([101,100,103,101,45,112,105,110,103,46,118,101,114,99,101,108,46,97,112,112 ]))"
      )
      expect(edgeVM.context.decode).toBe('edge-ping.vercel.app')
    })

    it('supports a vary of encodings', async () => {
      const encodings = [
        'ascii',
        'big5',
        'euc-jp',
        'euc-kr',
        'gb18030',
        'gbk',
        'hz-gb-2312',
        'ibm866',
        'iso-2022-jp',
        'iso-2022-kr',
        'iso-8859-1',
        'iso-8859-2',
        'iso-8859-3',
        'iso-8859-4',
        'iso-8859-5',
        'iso-8859-6',
        'iso-8859-7',
        'iso-8859-8',
        'iso-8859-8i',
        'iso-8859-10',
        'iso-8859-13',
        'iso-8859-14',
        'iso-8859-15',
        'iso-8859-16',
        'koi8-r',
        'koi8-u',
        'latin1',
        'macintosh',
        'shift-jis',
        'utf-16be',
        'utf-16le',
        'utf8',
        'windows-874',
        'windows-1250',
        'windows-1251',
        'windows-1252',
        'windows-1253',
        'windows-1254',
        'windows-1255',
        'windows-1256',
        'windows-1257',
        'windows-1258',
        'x-mac-cyrillic',
        'x-user-defined',
      ]

      const vm = new EdgeVM()
      const supported: string[] = []
      const notSupported: string[] = []

      encodings.forEach((encoding) => {
        try {
          vm.evaluate(`new TextDecoder('${encoding}')`)
          supported.push(encoding)
        } catch (error) {
          notSupported.push(encoding)
        }
      })

      expect(supported).toEqual(
        expect.arrayContaining([
          'ascii',
          'big5',
          'euc-jp',
          'euc-kr',
          'gb18030',
          'gbk',
          'ibm866',
          'iso-2022-jp',
          'iso-8859-1',
          'iso-8859-2',
          'iso-8859-3',
          'iso-8859-4',
          'iso-8859-5',
          'iso-8859-6',
          'iso-8859-7',
          'iso-8859-8',
          'iso-8859-10',
          'iso-8859-13',
          'iso-8859-14',
          'iso-8859-15',
          // "iso-8859-16",
          'koi8-r',
          'koi8-u',
          'latin1',
          'macintosh',
          'shift-jis',
          'utf-16be',
          'utf-16le',
          'utf8',
          'windows-874',
          'windows-1250',
          'windows-1251',
          'windows-1252',
          'windows-1253',
          'windows-1254',
          'windows-1255',
          'windows-1256',
          'windows-1257',
          'windows-1258',
          'x-mac-cyrillic',
        ])
      )
    })
  })
})

describe('Using `instanceof`', () => {
  it('uses the correct builtins for dependent APIs', () => {
    expect(
      new EdgeVM().evaluate(
        `(new TextEncoder().encode('abc')) instanceof Uint8Array`
      )
    ).toBe(true)
    expect(
      new EdgeVM().evaluate(
        `(new TextEncoder().encode('abc')) instanceof Object`
      )
    ).toBe(true)
    expect(
      new EdgeVM().evaluate(
        `(new TextEncoder().encode('abc')) instanceof Object`
      )
    ).toBe(true)
    expect(
      new EdgeVM().evaluate(`
          class Foo {};
          const cls = Foo;
          cls instanceof Function;
        `)
    ).toEqual(true)
    expect(
      new EdgeVM().evaluate(
        `(new TextEncoderStream()).writable instanceof WritableStream`
      )
    ).toBe(true)
    expect(new EdgeVM().evaluate(`(new Uint8Array()) instanceof Object`)).toBe(
      true
    )
    expect(
      new EdgeVM().evaluate(`(new AbortController()) instanceof Object`)
    ).toBe(true)
    expect(
      new EdgeVM().evaluate(
        `(new URL('https://example.vercel.sh')) instanceof Object`
      )
    ).toBe(true)
    expect(
      new EdgeVM().evaluate(`(new URLSearchParams()) instanceof Object`)
    ).toBe(true)
    expect(new EdgeVM().evaluate(`(new URLPattern()) instanceof Object`)).toBe(
      true
    )
  })

  it('does not alter instanceof for literals and objects', async () => {
    expect(new EdgeVM().evaluate('new Float32Array() instanceof Object')).toBe(
      true
    )
    expect(
      new EdgeVM().evaluate('new Float32Array() instanceof Float32Array')
    ).toBe(true)
    expect(new EdgeVM().evaluate('[] instanceof Array')).toBe(true)
    expect(new EdgeVM().evaluate('new Array() instanceof Array')).toBe(true)
    expect(new EdgeVM().evaluate('/^hello$/gi instanceof RegExp')).toBe(true)
    expect(
      new EdgeVM().evaluate('new RegExp("^hello$", "gi") instanceof RegExp')
    ).toBe(true)
    expect(new EdgeVM().evaluate('({ foo: "bar" }) instanceof Object')).toBe(
      true
    )
    expect(
      new EdgeVM().evaluate('Object.create({ foo: "bar" }) instanceof Object')
    ).toBe(true)
    expect(
      new EdgeVM().evaluate('new Object({ foo: "bar" }) instanceof Object')
    ).toBe(true)
    expect(new EdgeVM().evaluate('(() => {}) instanceof Function')).toBe(true)
    expect(new EdgeVM().evaluate('(function () {}) instanceof Function')).toBe(
      true
    )
  })
})

describe('Event handlers', () => {
  it('allows to add a `fetch` event handler and respond with a response', async () => {
    const runtime = new EdgeVM()

    runtime.evaluate(`
      addEventListener("fetch", (event) => {
        event.respondWith(new Response('Hi there!'));
      })
    `)

    const res = await runtime.dispatchFetch('https://localhost.com')
    const text = await res.text()
    expect(text).toEqual('Hi there!')
  })

  it('allows to add a `fetch` event handler that extends execution with `waitUntil`', async () => {
    const runtime = new EdgeVM({
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

  it('allows to add a `fetch` event handler that responds without leaking server headers on a 200', async () => {
    const runtime = new EdgeVM()

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

  it('allows to add a `fetch` event handler that responds without leaking server headers on a 302', async () => {
    const runtime = new EdgeVM()

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

  it('allows to add a `fetch` event handler and respond throwing an error', async () => {
    const runtime = new EdgeVM()
    runtime.evaluate(`
      addEventListener('fetch', event => {
        return Promise.reject(new Error('Oh no!'))
      });
    `)

    const res = await runtime.dispatchFetch('https://edge-ping.vercel.app')
    expect(res.statusText).toEqual('Internal Server Error')
    expect(res.status).toEqual(500)
  })

  it('allows to add a `fetch` event handler and respond with a fetch response', async () => {
    const runtime = new EdgeVM()
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

  it('allows to add a `fetch` event handler and get an error response when not responding', async () => {
    const runtime = new EdgeVM()
    runtime.evaluate(`
      addEventListener('fetch', event => {
        return 'This should fail'
      });
    `)

    const res = await runtime.dispatchFetch('https://edge-ping.vercel.app')
    expect(res.statusText).toEqual('Internal Server Error')
    expect(res.status).toEqual(500)
  })

  it('allows to add a `fetch` event handler and get an error response when responding with no response', async () => {
    const runtime = new EdgeVM()
    runtime.evaluate(`
      addEventListener('fetch', event => {
        return event.respondWith('This should fail')
      });
    `)

    const res = await runtime.dispatchFetch('https://edge-ping.vercel.app')
    expect(res.statusText).toEqual('Internal Server Error')
    expect(res.status).toEqual(500)
  })

  it('does not allow to add more than one `fetch` event handler', async () => {
    const runtime = new EdgeVM()
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

  it('allows to add/remove generic `error` event handlers', async () => {
    const runtime = new EdgeVM()
    runtime.context.uncaught = jest.fn()
    runtime.evaluate(`addEventListener("error", self.uncaught)`)
    expect((runtime as any).__errorHandlers).toHaveLength(1)
    runtime.evaluate(`removeEventListener("error", self.uncaught)`)
    expect((runtime as any).__errorHandlers).toBeUndefined()
  })

  it('allows to add/remove `unhandledrejection` event handlers', async () => {
    const runtime = new EdgeVM()
    runtime.context.unhandled = jest.fn()
    runtime.evaluate(`addEventListener("unhandledrejection", self.unhandled)`)
    expect((runtime as any).__rejectionHandlers).toHaveLength(1)
    expect(handlerByEvent.get('unhandledRejection')).toBeDefined()
    const reason = new Error('Boom!!!')
    const promise = Promise.resolve()
    handlerByEvent.get('unhandledRejection')!(reason, promise)
    expect(runtime.context.unhandled).toHaveBeenCalledWith({ reason, promise })
    expect(runtime.context.unhandled).toHaveBeenCalledTimes(1)

    runtime.evaluate(
      `removeEventListener("unhandledrejection", self.unhandled)`
    )
    expect((runtime as any).__rejectionHandlers).toBeUndefined()
  })
})
