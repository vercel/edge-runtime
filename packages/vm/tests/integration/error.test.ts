import { EdgeVM } from '../../src'

test('Error maintains a stack trace', async () => {
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
