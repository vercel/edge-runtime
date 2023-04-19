/**
 * @jest-environment node
 */

import { EdgeVM } from '../src'

it('AbortController', async () => {
  const runtime = new EdgeVM()

  const fn = async () => {
    const controller = new AbortController()
    controller.abort()
    const err = await fetch('https://example.vercel.sh', {
      signal: controller.signal,
    }).then(
      () => Promise.reject('should not resolve'),
      (e) => e
    )

    return {
      '.constructor.name': err.constructor.name,
      'instanceof DOMException': err instanceof DOMException,
      'instanceof Error': err instanceof Error,
    }
  }

  const v: Awaited<ReturnType<typeof fn>> = await runtime.evaluate(
    `(${fn.toString()})()`
  )

  expect(v).toEqual<typeof v>({
    '.constructor.name': 'DOMException',
    'instanceof DOMException': true,
    'instanceof Error': true,
  })
})

it('handles prototype chain correctly', () => {
  const runtime = new EdgeVM()

  runtime.context.outsideError = new Error()

  const fn = () => {
    class TimeoutError extends Error {}
    class Timeout {}

    const err = new Error()
    // @ts-ignore
    const outside: Error = outsideError

    return {
      'inside instanceof TimeoutError': err instanceof TimeoutError,
      'inside instanceof Timeout': err instanceof Timeout,
      'outside instanceof TimeoutError': outside instanceof TimeoutError,
      'outside instanceof Timeout': outside instanceof Timeout,
    }
  }

  const v: ReturnType<typeof fn> = runtime.evaluate(`(${fn.toString()})()`)
  expect(v).toEqual<typeof v>({
    'inside instanceof TimeoutError': false,
    'inside instanceof Timeout': false,
    'outside instanceof TimeoutError': false,
    'outside instanceof Timeout': false,
  })
})
