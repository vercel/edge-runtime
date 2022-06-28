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
    })
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
