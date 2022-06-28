// Reference required types from the default lib

/// <reference lib="ES2019" />
/// <reference types="@types/node" />

import { Primitives } from '@edge-runtime/primitives'

declare global {
  // addressable runtime
  const EdgeRuntime: Record<never, never>

  // self-references
  const globalThis: Primitives
  const self: Primitives

  // abort-controller
  const AbortController: Primitives['AbortController']
  const AbortSignal: Primitives['AbortSignal']

  // aggregate-error-ponyfill
  const AggregateError: Primitives['AggregateError']

  // base64
  const atob: Primitives['atob']
  const btoa: Primitives['btoa']

  // blob
  const Blob: Primitives['Blob']

  // webCrypto
  const crypto: Primitives['crypto']
  const Crypto: Primitives['Crypto']
  const CryptoKey: Primitives['CryptoKey']
  const SubtleCrypto: Primitives['SubtleCrypto']

  // undici
  const fetch: Primitives['fetch']
  const File: Primitives['File']
  const FormData: Primitives['FormData']
  const Headers: Primitives['Headers']
  const Request: Primitives['Request']
  const Response: Primitives['Response']

  // webCache
  const CacheStorage: Primitives['CacheStorage']
  const Cache: Primitives['Cache']
  const caches: Primitives['caches']

  // webStreams
  const ReadableStream: Primitives['ReadableStream']
  const ReadableStreamBYOBReader: Primitives['ReadableStreamBYOBReader']
  const ReadableStreamDefaultReader: Primitives['ReadableStreamDefaultReader']
  const TransformStream: Primitives['TransformStream']
  const WritableStream: Primitives['WritableStream']
  const WritableStreamDefaultWriter: Primitives['WritableStreamDefaultWriter']

  // structured-clone
  const structuredClone: Primitives['structuredClone']

  // urlpattern
  const URLPattern: Primitives['URLPattern']

  // nodejs globals
  const Array: Primitives['Array']
  const ArrayBuffer: Primitives['ArrayBuffer']
  const Atomics: Primitives['Atomics']
  const BigInt: Primitives['BigInt']
  const BigInt64Array: Primitives['BigInt64Array']
  const BigUint64Array: Primitives['BigUint64Array']
  const Boolean: Primitives['Boolean']
  const clearInterval: Primitives['clearInterval']
  const clearTimeout: Primitives['clearTimeout']
  const console: Primitives['console']
  const DataView: Primitives['DataView']
  const Date: Primitives['Date']
  const decodeURI: Primitives['decodeURI']
  const decodeURIComponent: Primitives['decodeURIComponent']
  const encodeURI: Primitives['encodeURI']
  const encodeURIComponent: Primitives['encodeURIComponent']
  const Error: Primitives['Error']
  const EvalError: Primitives['EvalError']
  const Float32Array: Primitives['Float32Array']
  const Float64Array: Primitives['Float64Array']
  const Function: Primitives['Function']
  const Infinity: Primitives['Infinity']
  const Int8Array: Primitives['Int8Array']
  const Int16Array: Primitives['Int16Array']
  const Int32Array: Primitives['Int32Array']
  const Intl: Primitives['Intl']
  const isFinite: Primitives['isFinite']
  const isNaN: Primitives['isNaN']
  const JSON: Primitives['JSON']
  const Map: Primitives['Map']
  const Math: Primitives['Math']
  const Number: Primitives['Number']
  const Object: Primitives['Object']
  const parseFloat: Primitives['parseFloat']
  const parseInt: Primitives['parseInt']
  const Promise: Primitives['Promise']
  const Proxy: Primitives['Proxy']
  const RangeError: Primitives['RangeError']
  const ReferenceError: Primitives['ReferenceError']
  const Reflect: Primitives['Reflect']
  const RegExp: Primitives['RegExp']
  const Set: Primitives['Set']
  const setInterval: Primitives['setInterval']
  const setTimeout: Primitives['setTimeout']
  const SharedArrayBuffer: Primitives['SharedArrayBuffer']
  const String: Primitives['String']
  const Symbol: Primitives['Symbol']
  const SyntaxError: Primitives['SyntaxError']
  const TextDecoder: Primitives['TextDecoder']
  const TextEncoder: Primitives['TextEncoder']
  const TypeError: Primitives['TypeError']
  const Uint8Array: Primitives['Uint8Array']
  const Uint8ClampedArray: Primitives['Uint8ClampedArray']
  const Uint16Array: Primitives['Uint16Array']
  const Uint32Array: Primitives['Uint32Array']
  const URIError: Primitives['URIError']
  const URL: Primitives['URL']
  const URLSearchParams: Primitives['URLSearchParams']
  const WeakMap: Primitives['WeakMap']
  const WeakSet: Primitives['WeakSet']
  const WebAssembly: Primitives['WebAssembly']
}

export {}
