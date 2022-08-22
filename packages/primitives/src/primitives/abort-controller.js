import { AbortControllerImpl as AbortController } from '@flemist/abort-controller'
import { DOMException } from '@flemist/abort-controller/dist/lib/DOMException.mjs'
import {
  AbortSignalImpl as AbortSignal,
  abortSignalAbort,
  createAbortSignal,
} from '@flemist/abort-controller/dist/lib/AbortSignalImpl.mjs'

AbortSignal.timeout = function (milliseconds) {
  const signal = createAbortSignal()
  setTimeout(
    () =>
      abortSignalAbort(
        signal,
        new DOMException('The operation timed out.', 'TimeoutError')
      ),
    milliseconds
  )
  return signal
}
export { AbortController, AbortSignal, DOMException }
