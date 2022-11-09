// Reference required types from the default lib

/// <reference lib="ES2019" />
/// <reference types="@types/node" />

import * as Edge from '@edge-runtime/primitives'

declare global {
  function addEventListener(
    type: 'fetch',
    listener: (event: Edge.FetchEvent) => void
  ): void
  // addressable runtime
  const EdgeRuntime: Record<never, never>
  // base primitives
  const Array: typeof Array
  const ArrayBuffer: typeof ArrayBuffer
  const Atomics: typeof Atomics
  const BigInt: typeof BigInt
  const BigInt64Array: typeof BigInt64Array
  const BigUint64Array: typeof BigUint64Array
  const Boolean: typeof Boolean
  const clearInterval: typeof clearInterval
  const clearTimeout: typeof clearTimeout
  const DataView: typeof DataView
  const Date: typeof Date
  const decodeURI: typeof decodeURI
  const decodeURIComponent: typeof decodeURIComponent
  const encodeURI: typeof encodeURI
  const encodeURIComponent: typeof encodeURIComponent
  const Error: typeof Error
  const EvalError: typeof EvalError
  const Float32Array: typeof Float32Array
  const Float64Array: typeof Float64Array
  const Function: typeof Function
  const Infinity: typeof Infinity
  const Int8Array: typeof Int8Array
  const Int16Array: typeof Int16Array
  const Int32Array: typeof Int32Array
  const Intl: typeof Intl
  const isFinite: typeof isFinite
  const isNaN: typeof isNaN
  const JSON: typeof JSON
  const Map: typeof Map
  const Math: typeof Math
  const Number: typeof Number
  const Object: typeof Object
  const parseFloat: typeof parseFloat
  const parseInt: typeof parseInt
  const Promise: typeof Promise
  const Proxy: typeof Proxy
  const RangeError: typeof RangeError
  const ReferenceError: typeof ReferenceError
  const Reflect: typeof Reflect
  const RegExp: typeof RegExp
  const Set: typeof Set
  const setInterval: typeof setInterval
  const setTimeout: typeof setTimeout
  const SharedArrayBuffer: typeof SharedArrayBuffer
  const String: typeof String
  const Symbol: typeof Symbol
  const SyntaxError: typeof SyntaxError
  const TypeError: typeof TypeError
  const Uint8Array: typeof Uint8Array
  const Uint8ClampedArray: typeof Uint8ClampedArray
  const Uint16Array: typeof Uint16Array
  const Uint32Array: typeof Uint32Array
  const URIError: typeof URIError
  const WeakMap: typeof WeakMap
  const WeakSet: typeof WeakSet
  const WebAssembly: typeof WebAssembly

  // edge primitives
  const self: EdgeContext
  const globalThis: EdgeContext
  const AbortController: typeof Edge.AbortController
  const AbortSignal: typeof Edge.AbortSignal
  const atob: typeof Edge.atob
  const Blob: typeof Edge.Blob
  const btoa: typeof Edge.btoa
  const Cache: typeof Edge.Cache
  const caches: typeof Edge.caches
  const CacheStorage: typeof Edge.CacheStorage
  const console: typeof Edge.console
  const createCaches: typeof Edge.createCaches
  const crypto: typeof Edge.crypto
  const Crypto: typeof Edge.Crypto
  const CryptoKey: typeof Edge.CryptoKey
  const DOMException: typeof Edge.DOMException
  const Event: typeof Edge.Event
  const EventTarget: typeof Edge.EventTarget
  const fetch: typeof Edge.fetch
  const FetchEvent: typeof Edge.FetchEvent
  const File: typeof Edge.File
  const FormData: typeof Edge.FormData
  const Headers: typeof Edge.Headers
  const PromiseRejectionEvent: typeof Edge.PromiseRejectionEvent
  const ReadableStream: typeof Edge.ReadableStream
  const ReadableStreamBYOBReader: typeof Edge.ReadableStreamBYOBReader
  const ReadableStreamDefaultReader: typeof Edge.ReadableStreamDefaultReader
  const Request: typeof Edge.Request
  const Response: typeof Edge.Response
  const structuredClone: typeof Edge.structuredClone
  const SubtleCrypto: typeof Edge.SubtleCrypto
  const TextDecoder: typeof Edge.TextDecoder
  const TextEncoder: typeof Edge.TextEncoder
  const TransformStream: typeof Edge.TransformStream
  const URL: typeof Edge.URL
  const URLPattern: typeof Edge.URLPattern
  const URLSearchParams: typeof Edge.URLSearchParams
  const WritableStream: typeof Edge.WritableStream
  const WritableStreamDefaultWriter: typeof Edge.WritableStreamDefaultWriter
}

export {}
