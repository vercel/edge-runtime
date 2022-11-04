import type { Config, Global } from '@jest/types'
import type { JestEnvironment } from '@jest/environment'
import { EdgeVM } from '@edge-runtime/vm'
import { installCommonGlobals } from 'jest-util'
import { LegacyFakeTimers, ModernFakeTimers } from '@jest/fake-timers'
import { ModuleMocker } from 'jest-mock'

interface Context {
  [key: string | number]: any
}
export = class EdgeEnvironment implements JestEnvironment<number> {
  context: Context | null
  fakeTimers: LegacyFakeTimers<number> | null
  fakeTimersModern: ModernFakeTimers | null
  global: Global.Global
  moduleMocker: ModuleMocker | null

  constructor(config: Config.ProjectConfig) {
    const vm = new EdgeVM({
      extend: (context) => {
        context.global = context
        context.Buffer = Buffer
        return context
      },
      ...((config as any).projectConfig ?? config)?.testEnvironmentOptions
    })

    revealPrimitives(vm)
    this.context = vm.context

    const global = (this.global = Object.assign(
      this.context,
      config.testEnvironmentOptions
    ) as any)

    installCommonGlobals(global, config.globals)

    this.moduleMocker = new ModuleMocker(global)

    this.fakeTimers = new LegacyFakeTimers({
      config,
      global,
      moduleMocker: this.moduleMocker,
      timerConfig: {
        idToRef: (id: number) => id,
        refToId: (ref: number) => ref,
      },
    })

    this.fakeTimersModern = new ModernFakeTimers({
      config,
      global,
    })
  }

  async setup(): Promise<void> {}

  async teardown(): Promise<void> {
    if (this.fakeTimers != null) {
      this.fakeTimers.dispose()
    }
    if (this.fakeTimersModern != null) {
      this.fakeTimersModern.dispose()
    }
    this.context = null
    this.fakeTimers = null
    this.fakeTimersModern = null
  }

  exportConditions(): string[] {
    return ['edge']
  }

  getVmContext(): Context | null {
    return this.context
  }
}

/**
 * Jest will access some primitives directly through vm.context so we must
 * make them available. We do this by redefining the property in the
 * context object.
 */
function revealPrimitives(vm: EdgeVM<any>) {
  ;[
    'Array',
    'ArrayBuffer',
    'Atomics',
    'BigInt',
    'BigInt64Array',
    'BigUint64Array',
    'Boolean',
    'DataView',
    'Date',
    'decodeURI',
    'decodeURIComponent',
    'encodeURI',
    'encodeURIComponent',
    'Error',
    'EvalError',
    'Float32Array',
    'Float64Array',
    'Function',
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
    'Proxy',
    'RangeError',
    'ReferenceError',
    'Reflect',
    'RegExp',
    'Set',
    'SharedArrayBuffer',
    'String',
    'Symbol',
    'SyntaxError',
    'TypeError',
    'Uint8Array',
    'Uint8ClampedArray',
    'Uint16Array',
    'Uint32Array',
    'URIError',
    'WeakMap',
    'WeakSet',
    'WebAssembly',
  ].forEach((property) => {
    vm.evaluate(`
      Object.defineProperty(this, '${property}', {
        configurable: false,
        enumerable: false,
        value: ${property},
        writable: true,
      })
    `)
  })
}
