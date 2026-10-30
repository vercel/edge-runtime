/**
 * @jest-environment node
 */

import { types } from 'util'
import { EdgeVM } from '../src'

it('DOMException', async () => {
  const runtime = new EdgeVM()

  const fn = async () => {
    const error = new DOMException()

    return {
      '.constructor.name': error.constructor.name,
      'instanceof DOMException': error instanceof DOMException,
      'instanceof Error': error instanceof Error,
    }
  }

  const v: Awaited<ReturnType<typeof fn>> = await runtime.evaluate(
    `(${fn.toString()})()`,
  )

  expect(v).toEqual<typeof v>({
    '.constructor.name': 'DOMException',
    'instanceof DOMException': true,
    'instanceof Error': true,
  })
})

it('AbortController', async () => {
  const runtime = new EdgeVM()

  const fn = async () => {
    const controller = new AbortController()
    controller.abort()
    const err = await fetch('https://example.vercel.sh', {
      signal: controller.signal,
    }).then(
      () => Promise.reject('should not resolve'),
      (e) => e,
    )

    return {
      '.constructor.name': err.constructor.name,
      'instanceof DOMException': err instanceof DOMException,
      'instanceof Error': err instanceof Error,
      'signal instanceof AbortSignal': controller.signal instanceof AbortSignal,
    }
  }

  const v: Awaited<ReturnType<typeof fn>> = await runtime.evaluate(
    `(${fn.toString()})()`,
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

describe('patched constructors', () => {
  const patchedConstructors = [
    'Object',
    'Array',
    'RegExp',
    'Uint8Array',
    'ArrayBuffer',
    'Error',
    'SyntaxError',
    'TypeError',
  ]

  const outsideValues = () => ({
    Object: {},
    Array: [],
    RegExp: /./,
    Uint8Array: new Uint8Array(1),
    ArrayBuffer: new ArrayBuffer(1),
    Error: new Error(),
    SyntaxError: new SyntaxError(),
    TypeError: new TypeError(),
  })

  test('values created outside the VM are `instanceof` their constructor inside the VM', () => {
    const vm = new EdgeVM()
    vm.context.OUTSIDE_VALUES = outsideValues()
    for (const name of patchedConstructors) {
      expect([
        name,
        vm.evaluate(`OUTSIDE_VALUES.${name} instanceof ${name}`),
      ]).toEqual([name, true])
    }
  })

  test('a subclass created inside the VM only accepts its own instances', () => {
    const vm = new EdgeVM()
    vm.context.OUTSIDE_VALUES = outsideValues()
    const fn = () => {
      class MyArray extends Array {}
      class MyError extends Error {}
      // @ts-ignore
      const outside = OUTSIDE_VALUES
      return {
        'outside array instanceof MyArray': outside.Array instanceof MyArray,
        'outside error instanceof MyError': outside.Error instanceof MyError,
        'inside array instanceof MyArray': [] instanceof MyArray,
        'inside error instanceof MyError': new Error() instanceof MyError,
        'MyArray instance instanceof MyArray': new MyArray() instanceof MyArray,
        'MyArray instance instanceof Array': new MyArray() instanceof Array,
        'MyError instance instanceof Error': new MyError() instanceof Error,
      }
    }
    const v: ReturnType<typeof fn> = vm.evaluate(`(${fn.toString()})()`)
    expect(v).toEqual<typeof v>({
      'outside array instanceof MyArray': false,
      'outside error instanceof MyError': false,
      'inside array instanceof MyArray': false,
      'inside error instanceof MyError': false,
      'MyArray instance instanceof MyArray': true,
      'MyArray instance instanceof Array': true,
      'MyError instance instanceof Error': true,
    })
  })

  test('constructors are not wrapped in a Proxy', () => {
    const vm = new EdgeVM()
    for (const name of patchedConstructors) {
      expect([name, types.isProxy(vm.evaluate(name))]).toEqual([name, false])
    }
  })

  test('constructors keep their identity and source text', () => {
    const vm = new EdgeVM()
    expect(vm.evaluate(`({}).constructor === Object`)).toBe(true)
    expect(vm.evaluate(`[].constructor === Array`)).toBe(true)
    expect(vm.evaluate(`/./.constructor === RegExp`)).toBe(true)
    expect(vm.evaluate(`Function.prototype.toString.call(Object)`)).toBe(
      'function Object() { [native code] }',
    )
  })

  test('constructors shared with the Node.js realm through `extend` are left untouched', () => {
    const vm = new EdgeVM({
      extend: (context) => {
        context.Uint8Array = Uint8Array
        context.ArrayBuffer = ArrayBuffer
        return context
      },
    })
    vm.context.OUTSIDE_VALUES = outsideValues()
    for (const name of ['Uint8Array', 'ArrayBuffer'] as const) {
      expect(
        Object.getOwnPropertyDescriptor(globalThis[name], Symbol.hasInstance),
      ).toBeUndefined()
      expect(vm.evaluate(`OUTSIDE_VALUES.${name} instanceof ${name}`)).toBe(
        true,
      )
    }
  })
})
