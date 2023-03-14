import type { CreateContextOptions } from 'vm'
import { createContext, runInContext } from 'vm'
import { createRequire } from './require'
import { tempFile } from './temp-file'

export interface VMOptions<T> {
  /**
   * Provide code generation options to the Node.js VM.
   * If you don't provide any option, code generation will be disabled.
   */
  codeGeneration?: CreateContextOptions['codeGeneration']
  /**
   * Allows to extend the VMContext. Note that it must return a contextified
   * object so ideally it should return the same reference it receives.
   */
  extend?: (context: VMContext) => VMContext & T
  /**
   * Provides an initial map to the require cache.
   * If none is given, it will be initialized to an empty map.
   */
  requireCache?: Map<string, Record<string | number, any>>
}

/**
 * A raw VM with a context that can be extended on instantiation. Implements
 * a realm-like interface where one can evaluate code or require CommonJS
 * modules in multiple ways.
 */
export class VM<T extends Record<string | number, any>> {
  private readonly requireFn: (referrer: string, specifier: string) => any
  public readonly requireCache: Map<string, Record<string | number, any>>
  public readonly context: VMContext & T

  constructor(options: VMOptions<T> = {}) {
    const context = createContext(
      {},
      {
        name: 'Edge Runtime',
        codeGeneration: options.codeGeneration ?? {
          strings: false,
          wasm: true,
        },
      }
    ) as VMContext

    this.requireCache = options.requireCache ?? new Map()
    this.context = options.extend?.(context) ?? (context as VMContext & T)
    this.requireFn = createRequire(this.context, this.requireCache)
  }

  /**
   * Allows to run arbitrary code within the VM.
   */
  evaluate<T = any>(code: string): T {
    return runInContext(code, this.context)
  }

  /**
   * Allows to require a CommonJS module referenced in the provided file
   * path within the VM context. It will return its exports.
   */
  require<T extends Record<string | number, any> = any>(filepath: string): T {
    return this.requireFn(filepath, filepath)
  }

  /**
   * Same as `require` but it will copy each of the exports in the context
   * of the vm. Then exports can be used inside of the vm with an
   * evaluated script.
   */
  requireInContext<T extends Record<string | number, any> = any>(
    filepath: string
  ): void {
    const moduleLoaded = this.require<T>(filepath)
    for (const [key, value] of Object.entries(moduleLoaded)) {
      this.context[key as keyof typeof this.context] = value
    }
  }

  /**
   * Same as `requireInContext` but allows to pass the code instead of a
   * reference to a file. It will create a temporary file and then load
   * it in the VM Context.
   */
  requireInlineInContext(code: string): void {
    const file = tempFile(code)
    this.requireInContext(file.path)
    file.remove()
  }
}

export interface VMContext {
  Array: typeof Array
  ArrayBuffer: typeof ArrayBuffer
  Atomics: typeof Atomics
  BigInt: typeof BigInt
  BigInt64Array: typeof BigInt64Array
  BigUint64Array: typeof BigUint64Array
  Boolean: typeof Boolean
  DataView: typeof DataView
  Date: typeof Date
  decodeURI: typeof decodeURI
  decodeURIComponent: typeof decodeURIComponent
  encodeURI: typeof encodeURI
  encodeURIComponent: typeof encodeURIComponent
  Error: typeof Error
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
  Proxy: typeof Proxy
  RangeError: typeof RangeError
  ReferenceError: typeof ReferenceError
  Reflect: typeof Reflect
  RegExp: typeof RegExp
  Set: typeof Set
  SharedArrayBuffer: typeof SharedArrayBuffer
  String: typeof String
  Symbol: typeof Symbol
  SyntaxError: typeof SyntaxError
  TypeError: typeof TypeError
  Uint8Array: typeof Uint8Array
  Uint8ClampedArray: typeof Uint8ClampedArray
  Uint16Array: typeof Uint16Array
  Uint32Array: typeof Uint32Array
  URIError: typeof URIError
  WeakMap: typeof WeakMap
  WeakSet: typeof WeakSet
  WebAssembly: typeof WebAssembly
  [key: string | number]: any
}
