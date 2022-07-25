import { EdgeVM } from '../../src'

test('preload web standard APIs', () => {
  const edgeVM = new EdgeVM()
  edgeVM.evaluate('this.headers = new Headers()')
  edgeVM.evaluate(
    "this.request = new Request('https://edge-ping.vercel.app', { headers: new Headers({ 'Content-Type': 'text/xml' }) })"
  )

  expect(edgeVM.context.headers).toBeTruthy()
  expect(edgeVM.context.request).toBeTruthy()
  expect(edgeVM.context.request.headers.get('Content-Type')).toEqual('text/xml')
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

it('allows to run fetch', async () => {
  const textp = await new EdgeVM().evaluate(
    `fetch('https://example.vercel.sh').then(res => res.text())`
  )
  expect(textp.startsWith('<!doctype html>')).toBe(true)
})

it('TextDecoder works with Uint8Array', async () => {
  const buffer = new Uint8Array([
    123, 34, 110, 97, 109, 101, 34, 58, 34, 74, 111, 104, 110, 34, 44, 34, 105,
    97, 116, 34, 58, 49, 54, 53, 56, 55, 52, 49, 54, 51, 57, 44, 34, 101, 120,
    112, 34, 58, 49, 54, 54, 49, 51, 51, 51, 54, 51, 57, 44, 34, 106, 116, 105,
    34, 58, 34, 99, 99, 53, 98, 48, 99, 55, 100, 45, 99, 49, 48, 99, 45, 52, 57,
    51, 98, 45, 57, 98, 54, 102, 45, 102, 52, 99, 51, 101, 50, 101, 97, 97, 52,
    50, 98, 34, 125,
  ])

  const decoded = new TextDecoder().decode(buffer)
  expect(JSON.parse(decoded)).toStrictEqual({
    name: 'John',
    iat: 1658741639,
    exp: 1661333639,
    jti: 'cc5b0c7d-c10c-493b-9b6f-f4c3e2eaa42b',
  })
})

it('TextDecoder works with Uint8Array from parent realm', async () => {
  const fn = await new EdgeVM().evaluate(`
    (function decode(buffer) {
      return new TextDecoder().decode(buffer);
    })
  `)

  const buffer = new Uint8Array([
    123, 34, 110, 97, 109, 101, 34, 58, 34, 74, 111, 104, 110, 34, 44, 34, 105,
    97, 116, 34, 58, 49, 54, 53, 56, 55, 52, 49, 54, 51, 57, 44, 34, 101, 120,
    112, 34, 58, 49, 54, 54, 49, 51, 51, 51, 54, 51, 57, 44, 34, 106, 116, 105,
    34, 58, 34, 99, 99, 53, 98, 48, 99, 55, 100, 45, 99, 49, 48, 99, 45, 52, 57,
    51, 98, 45, 57, 98, 54, 102, 45, 102, 52, 99, 51, 101, 50, 101, 97, 97, 52,
    50, 98, 34, 125,
  ])

  const decoded = fn(buffer)
  expect(JSON.parse(decoded)).toStrictEqual({
    name: 'John',
    iat: 1658741639,
    exp: 1661333639,
    jti: 'cc5b0c7d-c10c-493b-9b6f-f4c3e2eaa42b',
  })
})

it('TextDecoder supports a vary of encodings', async () => {
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

it('uses the same builtins in polyfills as in VM', () => {
  expect(
    new EdgeVM().evaluate(
      `(new TextEncoder().encode('abc')) instanceof Uint8Array`
    )
  ).toBe(true)
  expect(
    new EdgeVM().evaluate(`(new TextEncoder().encode('abc')) instanceof Object`)
  ).toBe(true)
  expect(new EdgeVM().evaluate(`(new Uint8Array()) instanceof Object`)).toBe(
    true
  )
  expect(
    new EdgeVM().evaluate(`(new AbortController()) instanceof Object`)
  ).toBe(true)
  expect(
    new EdgeVM().evaluate(`(new URL('https://vercel.com')) instanceof Object`)
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
    { api: 'TextEncoder' },
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
