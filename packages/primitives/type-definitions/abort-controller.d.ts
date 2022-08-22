declare const AbortControllerConstructor: typeof AbortController
declare const AbortSignalConstructor: typeof AbortSignal
declare const DOMExceptionConstructor: typeof DOMException

declare var WathwgAbortSignal: {
  prototype: AbortSignalConstructor
  new (): AbortSignalConstructor
  /** Returns an AbortSignal instance which will be aborted in milliseconds milliseconds. Its abort reason will be set to a "TimeoutError" DOMException. */
  timeout(milliseconds: number): AbortSignal
}

export {
  AbortControllerConstructor as AbortController,
  DOMExceptionConstructor as DOMException,
  WathwgAbortSignal as AbortSignal,
}
