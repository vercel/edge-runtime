import type { Primitives } from '../dist'
import primitives from '../dist'

const APIS: Array<keyof Primitives> = [
  'AbortController',
  'AbortSignal',
  'AggregateError',
  'Array',
  'ArrayBuffer',
  'atob',
  'Atomics',
  'BigInt',
  'BigInt64Array',
  'BigUint64Array',
  'Blob',
  'Boolean',
  'btoa',
  'Cache',
  'caches',
  'CacheStorage',
  'clearInterval',
  'clearTimeout',
  'console',
  'crypto',
  'Crypto',
  'CryptoKey',
  'DataView',
  'Date',
  'decodeURI',
  'decodeURIComponent',
  'encodeURI',
  'encodeURIComponent',
  'Error',
  'EvalError',
  'Event',
  'EventTarget',
  'fetch',
  'FetchEvent',
  'File',
  'Float32Array',
  'Float64Array',
  'FormData',
  'Function',
  'globalThis',
  'Headers',
  'Infinity',
  'Int8Array',
  'Int16Array',
  'Int32Array',
  'Intl',
  'isFinite',
  'isNaN',
  'JSON',
  'Map',
  'Math',
  'Number',
  'Object',
  'parseFloat',
  'parseInt',
  'Promise',
  'PromiseRejectionEvent',
  'Proxy',
  'RangeError',
  'ReadableStream',
  'ReadableStreamBYOBReader',
  'ReadableStreamDefaultReader',
  'ReferenceError',
  'Reflect',
  'RegExp',
  'Request',
  'Response',
  'self',
  'Set',
  'setInterval',
  'setTimeout',
  'SharedArrayBuffer',
  'String',
  'structuredClone',
  'SubtleCrypto',
  'Symbol',
  'SyntaxError',
  'TextDecoder',
  'TextEncoder',
  'TransformStream',
  'TypeError',
  'Uint8Array',
  'Uint8ClampedArray',
  'Uint16Array',
  'Uint32Array',
  'URIError',
  'URL',
  'URLPattern',
  'URLSearchParams',
  'WeakMap',
  'WeakSet',
  'WebAssembly',
  'WritableStream',
  'WritableStreamDefaultWriter',
]

APIS.forEach((api) => {
  test(api, () => {
    expect(primitives[api]).toBeTruthy()
    const constructorName = Object(primitives[api]).name
    if (constructorName) expect(constructorName).toBe(api)
  })
})

test('fetch is a function', () => {
  expect(typeof primitives.fetch).toEqual('function')
})

test('crypto is properly exposed', () => {
  expect(primitives.crypto).toBeTruthy()
  expect(primitives.crypto.getRandomValues).toBeTruthy()
  expect(primitives.crypto.randomUUID).toBeTruthy()
  expect(primitives.crypto.subtle).toBeTruthy()
  expect(primitives.crypto.subtle.encrypt).toBeTruthy()
  expect(primitives.crypto.subtle.decrypt).toBeTruthy()
  expect(primitives.crypto.subtle.sign).toBeTruthy()
  expect(primitives.crypto.subtle.digest).toBeTruthy()
  expect(primitives.crypto.subtle.verify).toBeTruthy()
  expect(primitives.crypto.subtle.generateKey).toBeTruthy()
  expect(primitives.crypto.subtle.deriveKey).toBeTruthy()
  expect(primitives.crypto.subtle.deriveBits).toBeTruthy()
  expect(primitives.crypto.subtle.importKey).toBeTruthy()
  expect(primitives.crypto.subtle.exportKey).toBeTruthy()
  expect(primitives.crypto.subtle.wrapKey).toBeTruthy()
  expect(primitives.crypto.subtle.unwrapKey).toBeTruthy()
})

test('crypto is working as expected', () => {
  const array = new Uint32Array(10)
  expect(primitives.crypto.getRandomValues(array)).toHaveLength(array.length)
})
