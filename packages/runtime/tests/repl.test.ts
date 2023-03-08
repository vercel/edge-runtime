import { ChildProcess, spawn } from 'child_process'
import path from 'path'

type ChildPromise = {
  stdout: string
  stderr: string
  code: number
}

const scriptPath = path.resolve(__dirname, '../dist/cli/index.js')

const childPromise = (subprocess: ChildProcess): Promise<ChildPromise> =>
  new Promise((resolve) => {
    let stdout: any = ''
    let stderr: any = ''

    if (subprocess.stdout) {
      subprocess.stdout.on('data', (data: any) => (stdout += data.toString()))
    }

    if (subprocess.stderr) {
      subprocess.stderr.on('data', (data: any) => (stderr += data.toString()))
    }

    subprocess.on('close', (code) => resolve({ code, stdout, stderr }))
  })

describe('contains all required primitives', () => {
  it.each([
    { api: 'AbortController' },
    { api: 'AbortSignal' },
    { api: 'addEventListener' },
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
    { api: 'escape' },
    { api: 'eval' },
    { api: 'EvalError' },
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
    { api: 'removeEventListener' },
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
    { api: 'undefined' },
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
  ])('`$api` is defined in global scope', async ({ api }) => {
    const assertion = (() => {
      if (api === 'undefined') return `undefined === ${api}`
      if (api === 'NaN') return `Number.isNaN(${api})`
      return `!!${api}`
    })()

    const cli = spawn('node', [
      scriptPath,
      '--eval',
      `JSON.stringify(${assertion})`,
    ])

    const { stdout, stderr, code } = await childPromise(cli)
    expect(code).toBe(0)
    expect(JSON.parse(stdout)).toBe(true)
  })
})
