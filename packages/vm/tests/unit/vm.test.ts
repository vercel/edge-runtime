import path from 'path'
import { VM } from '../../src'

test('create an empty context', () => {
  const vm = new VM()
  vm.evaluate('this.foo = "bar"')
  expect(vm.context).toStrictEqual({ foo: 'bar' })
})

test('extend an empty a context with environment variables', () => {
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

test('extend an empty a context by returning it', () => {
  const vm = new VM({
    extend: (context) =>
      Object.assign(context, { process: { env: { NODE_ENV: 'development' } } }),
  })

  expect(vm.context.process.env.NODE_ENV).toEqual('development')
  const env = vm.evaluate('process.env.NODE_ENV')
  expect(env).toEqual('development')
})

test('extend an empty context with edgeVM APIs', () => {
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

test('evaluate an script in an empty context', () => {
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

test('require a filepath', () => {
  const vm = new VM()
  const modulepath = path.resolve(__dirname, '../fixtures/mock-url.js')
  const moduleLoaded = vm.require<{ URL: URL }>(modulepath)

  vm.context.URL = moduleLoaded.URL

  vm.evaluate('this.hasURL = !!URL')
  vm.evaluate('this.url = new URL("https://edge-ping.vercel.app")')

  expect(vm.context.hasURL).toBeTruthy()
  expect(vm.context.url.href).toEqual('https://edge-ping.vercel.app')
  expect(vm.context.URL.name).toEqual('MockURL')
})

test('require a CJS file module in an empty context', () => {
  const vm = new VM()

  const modulepath = path.resolve(__dirname, '../fixtures/mock-url.js')
  vm.requireInContext(modulepath)

  vm.evaluate('this.hasURL = !!URL')
  vm.evaluate('this.url = new URL("https://edge-ping.vercel.app")')

  expect(vm.context.hasURL).toBeTruthy()
  expect(vm.context.url.href).toEqual('https://edge-ping.vercel.app')
  expect(vm.context.URL.name).toEqual('MockURL')
})

test('require a CJS module in an empty context', () => {
  const vm = new VM()

  const script = `function MockURL (href) {
    if (!(this instanceof MockURL)) return new MockURL(href)
    this.href = href
  }

  module.exports.URL = MockURL`

  vm.requireInlineInContext(script)

  vm.evaluate('this.hasURL = !!URL')
  vm.evaluate('this.url = new URL("https://edge-ping.vercel.app")')

  expect(vm.context.hasURL).toBeTruthy()
  expect(vm.context.url.href).toEqual('https://edge-ping.vercel.app')
  expect(vm.context.URL.name).toEqual('MockURL')
})
