import { VM } from '../../src'

test('new Function is not allowed', () => {
  const vm = new VM()
  expect(() => {
    vm.evaluate('new Function(1)')
  }).toThrow({
    name: 'EvalError',
    message: 'Code generation from strings disallowed for this context',
  })
})

test('eval is not allowed', () => {
  const vm = new VM()
  expect(() => {
    vm.evaluate('eval("1 + 1")')
  }).toThrow({
    name: 'EvalError',
    message: 'Code generation from strings disallowed for this context',
  })
})

test('require is not defined', () => {
  const vm = new VM()
  expect(() => {
    vm.evaluate("const Blob = require('buffer').Blob; this.blob = new Blob()")
  }).toThrow({
    name: 'ReferenceError',
    message: 'require is not defined',
  })
})
