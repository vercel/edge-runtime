import { VM } from '../src/vm'

it('creates a VM with empty context', () => {
  const vm = new VM()
  vm.evaluate('this.foo = "bar"')
  expect(vm.context).toStrictEqual({ foo: 'bar' })
})

it('allows to extend the context with environment variables', () => {
  const vm = new VM({
    extend: (context) =>
      Object.assign(context, {
        process: { env: { NODE_ENV: 'development' } },
      }),
  })

  expect(vm.context.process.env.NODE_ENV).toEqual('development')
  const env = vm.evaluate('process.env.NODE_ENV')
  expect(env).toEqual('development')
})

it('allows to extend the context with APIs implementations', () => {
  class MockURL {
    href: string
    constructor(url: string) {
      this.href = url
    }
  }

  const vm = new VM({
    extend: (context) => {
      context.URL = MockURL
      return context
    },
  })

  vm.evaluate('this.hasURL = !!URL')
  vm.evaluate('this.url = new URL("https://edge-ping.vercel.app")')

  expect(vm.context.hasURL).toBeTruthy()
  expect(vm.context.url.href).toEqual('https://edge-ping.vercel.app')
  expect(vm.context.URL.name).toEqual('MockURL')
})

it('allows to extend the context with code evaluation', () => {
  const script = `
  function MockURL (href) {
    if (!(this instanceof MockURL)) return new MockURL(href)
    this.href = href
  }
  this.URL = MockURL`

  const vm = new VM()

  vm.evaluate(script)
  vm.evaluate('this.hasURL = !!URL')
  vm.evaluate('this.url = new URL("https://edge-ping.vercel.app")')

  expect(vm.context.hasURL).toBeTruthy()
  expect(vm.context.url.href).toEqual('https://edge-ping.vercel.app')
  expect(vm.context.URL.name).toEqual('MockURL')
})

it('does not allow to run `new Function`', () => {
  const vm = new VM()
  expect(() => {
    vm.evaluate('new Function(1)')
  }).toThrow({
    name: 'EvalError',
    message: 'Code generation from strings disallowed for this context',
  })
})

it('does not allow `eval`', () => {
  const vm = new VM()
  expect(() => {
    vm.evaluate('eval("1 + 1")')
  }).toThrow({
    name: 'EvalError',
    message: 'Code generation from strings disallowed for this context',
  })
})

it('does not define `require`', () => {
  const vm = new VM()
  expect(() => {
    vm.evaluate("const Blob = require('buffer').Blob; this.blob = new Blob()")
  }).toThrow({
    name: 'ReferenceError',
    message: 'require is not defined',
  })
})
