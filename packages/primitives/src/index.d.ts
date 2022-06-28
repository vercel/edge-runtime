/// <reference types="node" />

import type { Crypto as WebCrypto, CryptoKey } from '@peculiar/webcrypto'
import type { v4 as uuid } from 'uuid'
import type * as WebStream from 'web-streams-polyfill'
import type * as EventShim from 'event-target-shim'
import type * as Abort from 'abort-controller/dist/abort-controller.d'

declare class FetchEvent {
  awaiting: Set<Promise<void>>
  constructor(request: Request)
}

type URLPatternInput = URLPatternInit | string

declare class URLPattern {
  constructor(init?: URLPatternInput, baseURL?: string)
  test(input?: URLPatternInput, baseURL?: string): boolean
  exec(input?: URLPatternInput, baseURL?: string): URLPatternResult | null
  readonly protocol: string
  readonly username: string
  readonly password: string
  readonly hostname: string
  readonly port: string
  readonly pathname: string
  readonly search: string
  readonly hash: string
}

interface URLPatternInit {
  baseURL?: string
  username?: string
  password?: string
  protocol?: string
  hostname?: string
  port?: string
  pathname?: string
  search?: string
  hash?: string
}

interface URLPatternResult {
  inputs: [URLPatternInput]
  protocol: URLPatternComponentResult
  username: URLPatternComponentResult
  password: URLPatternComponentResult
  hostname: URLPatternComponentResult
  port: URLPatternComponentResult
  pathname: URLPatternComponentResult
  search: URLPatternComponentResult
  hash: URLPatternComponentResult
}

interface URLPatternComponentResult {
  input: string
  groups: {
    [key: string]: string | undefined
  }
}

export interface Primitives {
  // self-references
  globalThis: Primitives
  self: Primitives

  // abort-controller
  AbortController: typeof Abort.AbortController
  AbortSignal: typeof Abort.AbortSignal

  // aggregate-error-ponyfill
  AggregateError: typeof AggregateError

  // base64
  atob: (encoded: string) => string
  btoa: (str: string) => string

  // blob
  Blob: typeof Blob

  // webCrypto
  crypto: Crypto
  Crypto: typeof Crypto
  CryptoKey: typeof CryptoKey
  SubtleCrypto: typeof SubtleCrypto

  // undici
  fetch: typeof fetch
  File: typeof File
  FormData: typeof FormData
  Headers: typeof Headers
  Request: typeof Request
  Response: typeof Response

  // webCache
  CacheStorage: typeof CacheStorage
  Cache: typeof Cache
  caches: CacheStorage

  // webStreams
  ReadableStream: typeof WebStream.ReadableStream
  ReadableStreamBYOBReader: typeof WebStream.ReadableStreamBYOBReader
  ReadableStreamDefaultReader: typeof WebStream.ReadableStreamDefaultReader
  TransformStream: typeof WebStream.TransformStream
  WritableStream: typeof WebStream.WritableStream
  WritableStreamDefaultWriter: typeof WebStream.WritableStreamDefaultWriter

  // structured-clone
  structuredClone: <T>(any: T, options?: { lossy?: boolean }) => T

  // urlpattern
  URLPattern: typeof URLPattern

  // nodejs globals
  Array: typeof Array
  ArrayBuffer: typeof ArrayBuffer
  Atomics: typeof Atomics
  BigInt: typeof BigInt
  BigInt64Array: typeof BigInt64Array
  BigUint64Array: typeof BigUint64Array
  Boolean: typeof Boolean
  clearInterval: typeof clearInterval
  clearTimeout: typeof clearTimeout
  console: IConsole
  DataView: typeof DataView
  Date: typeof Date
  decodeURI: typeof decodeURI
  decodeURIComponent: typeof decodeURIComponent
  encodeURI: typeof encodeURI
  encodeURIComponent: typeof encodeURIComponent
  Error: typeof Error
  Event: EventShim.Event
  FetchEvent: typeof FetchEvent
  EventTarget: typeof EventShim.EventTarget
  EvalError: typeof EvalError
  Float32Array: typeof Float32Array
  Float64Array: typeof Float64Array
  Function: typeof Function
  Infinity: typeof Infinity
  Int8Array: typeof Int8Array
  Int16Array: typeof Int16Array
  Int32Array: typeof Int32Array
  Intl: typeof Intl
  isFinite: typeof isFinite
  isNaN: typeof isNaN
  JSON: typeof JSON
  Map: typeof Map
  Math: typeof Math
  Number: typeof Number
  Object: typeof Object
  parseFloat: typeof parseFloat
  parseInt: typeof parseInt
  Promise: typeof Promise
  PromiseRejectionEvent: typeof EventShim.EventTarget
  Proxy: typeof Proxy
  RangeError: typeof RangeError
  ReferenceError: typeof ReferenceError
  Reflect: typeof Reflect
  RegExp: typeof RegExp
  Set: typeof Set
  setInterval: typeof setInterval
  setTimeout: typeof setTimeout
  SharedArrayBuffer: typeof SharedArrayBuffer
  String: typeof String
  Symbol: typeof Symbol
  SyntaxError: typeof SyntaxError
  TextDecoder: typeof TextDecoder
  TextEncoder: typeof TextEncoder
  TypeError: typeof TypeError
  Uint8Array: typeof Uint8Array
  Uint8ClampedArray: typeof Uint8ClampedArray
  Uint16Array: typeof Uint16Array
  Uint32Array: typeof Uint32Array
  URIError: typeof URIError
  URL: typeof URL
  URLSearchParams: typeof URLSearchParams
  WeakMap: typeof WeakMap
  WeakSet: typeof WeakSet
  WebAssembly: typeof WebAssembly
}

declare class AggregateError<T extends Error = Error> extends Error {
  readonly name: 'AggregateError'
  readonly errors: readonly [T]
  constructor(errors: ReadonlyArray<T | Record<string, any> | string>)
}

interface Crypto extends WebCrypto {
  randomUUID: typeof uuid
}

interface IConsole {
  assert: Console['assert']
  count: Console['count']
  debug: Console['debug']
  dir: Console['dir']
  error: Console['error']
  info: Console['info']
  log: Console['log']
  time: Console['time']
  timeEnd: Console['timeEnd']
  timeLog: Console['timeLog']
  trace: Console['trace']
  warn: Console['warn']
}

declare const context: Primitives

export function addPrimitives<T extends { [key: string | number]: any }>(
  context: T
): Primitives

export default context
