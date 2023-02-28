import { EdgeVM } from '../../src'

describe('preload web standard APIs', () => {
  describe('TextDecoder', () => {
    it('with Uint8Array', () => {
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

  it('URL', () => {
    const edgeVM = new EdgeVM()
    edgeVM.evaluate("this.url = new URL('https://edge-ping.vercel.app/')")
    expect(edgeVM.context.url).toBeTruthy()
  })

  describe('fetch', () => {
    it('parsing to text', async () => {
      const html = await new EdgeVM().evaluate(
        `fetch('https://example.vercel.sh').then(res => res.text())`
      )
      expect(html.startsWith('<!doctype html>')).toBe(true)
    })

    it('with Headers', async () => {
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

    it('with AbortController', async () => {
      const promise = new EdgeVM().evaluate(`
      const controller = new AbortController();
      controller.abort();
      fetch('https://example.vercel.sh', {
        signal: controller.signal,
      });
      `)

      await expect(promise).rejects.toThrowError('The operation was aborted.')
    })
  })
})

test('interact with fetch out of vm', async () => {
  const edgeVM = new EdgeVM()
  const promise = edgeVM.evaluate<Promise<Response>>(
    "fetch('https://edge-ping.vercel.app')"
  )

  expect(promise).toBeTruthy()
  const { url, status } = await promise

  expect(url).toEqual('https://edge-ping.vercel.app/')
  expect(status).toEqual(200)
})

test('extend a web standard API', async () => {
  const edgeVM = new EdgeVM({
    extend: (context) => {
      const rawFetch = context.fetch.bind(context.fetch)
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

// TODO: add decoder case
it('uses the same builtins in polyfills as in VM', () => {
  expect(
    new EdgeVM().evaluate(
      `(new TextEncoder().encode('abc')) instanceof Uint8Array`
    )
  ).toBe(true)
  expect(
    new EdgeVM().evaluate(`(new TextEncoder().encode('abc')) instanceof Object`)
  ).toBe(true)
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
  expect(new EdgeVM().evaluate('({ foo: "bar" }) instanceof Object')).toBe(true)
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

describe('contains all required primitives', () => {
  let edgeVM: EdgeVM<any>

  beforeAll(() => {
    edgeVM = new EdgeVM()
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
    { api: 'Cache' },
    { api: 'caches' },
    { api: 'caches' },
    { api: 'CacheStorage' },
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
    expect(edgeVM.evaluate(api)).toBeDefined()
  })
})
