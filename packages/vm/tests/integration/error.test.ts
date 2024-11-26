import { EdgeVM } from '../../src'

test.skip('Error maintains a stack trace', async () => {
  const log = jest.fn()
  console.log = log

  function fn() {
    console.log(new Error('hello, world!'))
  }

  const vm = new EdgeVM()
  vm.evaluate(`(${fn})()`)

  expect(log).toHaveBeenCalledTimes(1)
  expect(log.mock.lastCall[0]).toMatch(/^Error: hello, world!\s+at fn/m)
})

test.skip('additional error properties', async () => {
  const log = jest.fn()
  console.log = log

  function fn() {
    class CustomError extends Error {
      name = 'CustomError'
      constructor(
        message: string,
        private digest: string,
        private cause?: Error,
      ) {
        super(message)
      }
    }
    console.log(new CustomError('without cause', 'digest1'))
    console.log(new CustomError('with cause', 'digest2', new Error('oh no')))
  }

  const vm = new EdgeVM()
  vm.evaluate(`(${fn})()`)

  expect(log).toHaveBeenCalledTimes(2)
  const [[withoutCause], [withCause]] = log.mock.calls
  expect(withoutCause).toMatch(
    /^CustomError: without cause\s+at fn.+\{.+digest: 'digest1',.+cause: undefined.+\}/ms,
  )
  expect(withCause).toMatch(
    /^CustomError: with cause\s+at fn.+\{.+digest: 'digest2',.+cause: Error: oh no.+.+\}/ms,
  )
})
