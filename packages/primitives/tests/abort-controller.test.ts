import { AbortController, AbortSignal, DOMException } from '../abort-controller'
import { fetch } from '../fetch'

describe('AbortController', () => {
  it('allows to abort fetch', async () => {
    expect.assertions(1)
    const controller = new AbortController()
    controller.abort()

    try {
      await fetch('https://example.vercel.sh', {
        signal: controller.signal,
      })
    } catch (error: any) {
      expect(error.message).toEqual('The operation was aborted')
    }
  })

  it.each([
    {
      title: 'with a reason',
      reason: new Error('stop!'),
    },
    {
      title: 'with no reason',
      reason: new DOMException('The operation was aborted.', 'AbortError'),
    },
  ])('aborts $title', async ({ reason }) => {
    const controller = new AbortController()
    const { signal } = controller
    const promise = runAbortedProcess({ signal })
    expect(signal.aborted).toBe(false)
    controller.abort(reason)
    await expect(promise).rejects.toThrow(reason)
    expect(signal.aborted).toBe(true)
    expect(signal.reason).toBe(reason)
  })

  // whatwg compliance tests: https://dom.spec.whatwg.org/#interface-abortcontroller
  it('has signal read-only property', () => {
    const controller = new AbortController()
    expect(controller.signal).toBeInstanceOf(AbortSignal)
    expect(() => (controller.signal = 'not-supported')).toThrow(
      'Cannot set property signal of #<AbortController> which has only a getter'
    )
  })
})

describe('AbortSignal', () => {
  describe('timeout()', () => {
    it('automatically aborts after some time', async () => {
      const reason = new DOMException(
        'The operation timed out.',
        'TimeoutError'
      )
      const signal = AbortSignal.timeout(100)
      const promise = runAbortedProcess({ signal })
      expect(signal.aborted).toBe(false)
      await expect(promise).rejects.toThrow(reason)
      expect(signal.aborted).toBe(true)
      expect(signal.reason).toEqual(reason)
    })
  })

  describe('abort()', () => {
    it('creates aborted signal with a reason', async () => {
      const reason = 'some reason'
      const signal = AbortSignal.abort(reason)
      expect(signal.aborted).toBe(true)
      expect(signal.reason).toBe(reason)
    })

    it('creates signal with no reason', async () => {
      const reason = new DOMException(
        'The operation was aborted.',
        'AbortError'
      )
      const signal = AbortSignal.abort()
      expect(signal.aborted).toBe(true)
      expect(signal.reason).toEqual(reason)
    })
  })

  // whatwg compliance tests: https://dom.spec.whatwg.org/#abortsignal
  it('has reason read-only property', () => {
    const reason = 'some reason'
    const signal = AbortSignal.abort(reason)
    expect(signal.reason).toBe(reason)
    expect(() => (signal.reason = 'not-supported')).toThrow(
      'Cannot set property reason of #<AbortSignal> which has only a getter'
    )
  })

  it('has aborted read-only property', () => {
    const aborted = true
    const signal = AbortSignal.abort()
    expect(signal.aborted).toBe(aborted)
    expect(() => (signal.aborted = true)).toThrow(
      'Cannot set property aborted of #<AbortSignal> which has only a getter'
    )
  })

  it('can not be created with constructor', () => {
    expect(() => new AbortSignal()).toThrow(
      new TypeError('Illegal constructor.')
    )
  })
})

function runAbortedProcess({ signal }: { signal: AbortSignal }) {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted?.()
    signal.addEventListener('abort', () => {
      setTimeout(() => reject(signal.reason), 0)
    })
    setTimeout(resolve, 500)
  })
}
