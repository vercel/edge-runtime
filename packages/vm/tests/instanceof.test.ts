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
      'signal instanceof AbortSignal': controller.signal instanceof AbortSignal,
    }
  }

  const v: Awaited<ReturnType<typeof fn>> = await runtime.evaluate(
    `(${fn.toString()})()`
  )

  expect(v).toEqual<typeof v>({
    '.constructor.name': 'DOMException',
    'instanceof DOMException': true,
    'instanceof Error': true,
    'signal instanceof AbortSignal': true,
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

describe('instanceof overriding', () => {
  test('binary array created outside of the VM is `instanceof` Object inside the VM', () => {
    const vm = new EdgeVM()
    vm.context.MY_BINARY_ARRAY = new Uint8Array([1, 2, 3])
    expect(vm.evaluate(`MY_BINARY_ARRAY instanceof Object`)).toBe(true)
  })

  test('binary array created outside of the VM is `instanceof` Uint8Array inside the VM', () => {
    const vm = new EdgeVM()
    vm.context.MY_BINARY_ARRAY = new Uint8Array([1, 2, 3])
    expect(vm.evaluate(`MY_BINARY_ARRAY instanceof Uint8Array`)).toBe(true)
  })

  test('binary array created inside the VM is NOT `instanceof` Object outside the VM', () => {
    const vm = new EdgeVM()
    vm.evaluate(`MY_BINARY_ARRAY = new Uint8Array([1, 2, 3])`)
    expect(vm.context.MY_BINARY_ARRAY instanceof Object).toBe(false)
  })

  test('binary array created inside the VM is NOT `instanceof` Uint8Array outside the VM', () => {
    const vm = new EdgeVM()
    vm.evaluate(`MY_BINARY_ARRAY = new Uint8Array([1, 2, 3])`)
    expect(vm.context.MY_BINARY_ARRAY instanceof Uint8Array).toBe(false)
  })

  test('literal object created inside the VM is `instanceof` Object inside the VM', () => {
    const vm = new EdgeVM()
    expect(vm.evaluate(`({}) instanceof Object`)).toBe(true)
  })

  test('literal object created inside the VM is NOT `instanceof` Object outside the VM', () => {
    const vm = new EdgeVM()
    expect(vm.evaluate(`({}) instanceof Object`)).toBe(true)
  })

  test('literal object created outside the VM is `instanceof` Object inside the VM', () => {
    const vm = new EdgeVM()
    vm.context.MY_OBJECT = {}
    expect(vm.evaluate(`MY_OBJECT instanceof Object`)).toBe(true)
  })

  test('literal array created inside the VM is `instanceof` Array inside the VM', () => {
    const vm = new EdgeVM()
    expect(vm.evaluate(`[] instanceof Array`)).toBe(true)
  })

  test('literal array created inside the VM is NOT `instanceof` Array outside the VM', () => {
    const vm = new EdgeVM()
    expect(vm.evaluate(`[] instanceof Array`)).toBe(true)
  })

  test('literal array created outside the VM is `instanceof` Array inside the VM', () => {
    const vm = new EdgeVM()
    vm.context.MY_ARRAY = []
    expect(vm.evaluate(`MY_ARRAY instanceof Array`)).toBe(true)
  })

  test('literal regexp created inside the VM is `instanceof` RegExp inside the VM', () => {
    const vm = new EdgeVM()
    expect(vm.evaluate(`/./ instanceof RegExp`)).toBe(true)
  })

  test('literal regexp created inside the VM is NOT `instanceof` RegExp outside the VM', () => {
    const vm = new EdgeVM()
    expect(vm.evaluate(`/./ instanceof RegExp`)).toBe(true)
  })

  test('literal regexp created outside the VM is `instanceof` RegExp inside the VM', () => {
    const vm = new EdgeVM()
    vm.context.MY_REGEXP = /./
    expect(vm.evaluate(`MY_REGEXP instanceof RegExp`)).toBe(true)
  })
})
