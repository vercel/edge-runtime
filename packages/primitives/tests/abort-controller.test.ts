import { AbortController, AbortSignal, DOMException } from '../abort-controller'
import { fetch } from '../fetch'

describe('Abort Controller', () => {
  function process({ signal }: { signal: AbortSignal }) {
    return new Promise((resolve, reject) => {
      signal.throwIfAborted?.()
      signal.addEventListener('abort', () => {
        setTimeout(() => reject(signal.reason), 0)
      })
      setTimeout(resolve, 10)
    })
  }

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

  // whatwg compliance tests: https://dom.spec.whatwg.org/#interface-abortcontroller
  it('has signal properties', () => {
    expect(new AbortController().signal).toBeInstanceOf(AbortSignal)
  })

  it.each([
    {
      title: 'with a reason',
      reason: new Error('stop!'),
    },
    {
      title: 'with no reason',
      reason: new DOMException(
        'This operation was aborted', // spec message is different https://webidl.spec.whatwg.org/#aborterror
        'AbortError'
      ),
    },
  ])('aborts $title', async ({ reason }) => {
    const controller = new AbortController()
    const { signal } = controller
    const promise = process({ signal })
    expect(signal.aborted).toBe(false)
    controller.abort(reason)
    await expect(promise).rejects.toThrow(reason)
    expect(signal.aborted).toBe(true)
    expect(signal.reason).toBe(reason)
  })

  it('aborts on timeout', async () => {
    const reason = new DOMException('The operation timed out.', 'TimeoutError')
    const signal = AbortSignal.timeout(5)
    const promise = process({ signal })
    expect(signal.aborted).toBe(false)
    await expect(promise).rejects.toThrow(reason)
    expect(signal.aborted).toBe(true)
    expect(signal.reason).toEqual(reason)
  })
})
