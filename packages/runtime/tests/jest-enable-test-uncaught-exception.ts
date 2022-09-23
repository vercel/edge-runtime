// type ProvidesCallback = ((cb: DoneCallback) => void | undefined) | (() => Promise<unknown>);
// type JestFNReturn = ((cb: jest.DoneCallback) => void) | undefined | Promise<unknown>;
export function enableTestUncaughtException<T>(
  fn: (pro?: typeof process) => void | undefined | Promise<unknown>
): jest.ProvidesCallback {
  return () => {
    const originalJestListeners = {
      uncaughtException: [],
      unhandledRejection: [],
    }
    const wrapProcess = Symbol.for('jest-wrap-process')
    const originalProcess = (process as any)[wrapProcess]()
    if (!originalProcess) {
      throw new Error('jest-wrap-process not found')
    }
    Object.keys(originalJestListeners).forEach((event) => {
      originalProcess.listeners(event).forEach((listener: any) => {
        ;(originalJestListeners as any)[event].push(listener)
        originalProcess.off(event, listener)
      })
    })
    // const uncaughtErrorPromise = new Promise((resolve) => {
    //   ;(process as any)._original().on('unhandledRejection', (reason: any) => {
    //     console.error('unhandledRejection', reason)
    //   })
    // })

    let ret: Promise<unknown>
    try {
      const possiblePromise = fn(originalProcess)
      if (possiblePromise instanceof Promise) {
        ret = possiblePromise
      } else if (typeof possiblePromise === 'function') {
        // i don't know what to do here
        throw new Error('not implemented')
      } else {
        ret = Promise.resolve(possiblePromise)
      }
    } catch (err) {
      ret = Promise.reject(err)
    }
    return ret.finally(() => {
      Object.keys(originalJestListeners).forEach((event) => {
        for (
          let listener;
          (listener = (originalJestListeners as any)[event].pop()) !==
          undefined;

        ) {
          ;(process as any)[wrapProcess]().on(event, listener)
        }
      })
    })
  }
}
