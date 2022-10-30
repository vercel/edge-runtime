import { EdgeVM } from '../../src'

test('can override fetch global in strict mode', async () => {
  const vm = new EdgeVM()

  vm.context.expect = expect

  const text = await vm.evaluate<Promise<string>>(`
    (() => {
      "use strict";
      expect(fetch).toBeDefined();
      fetch = async () => new Response("Hello world");
      return fetch().then(x => x.text())
    })();
  `)
  expect(text).toBe('Hello world')
})

test('can override fetch global without strict mode', async () => {
  const vm = new EdgeVM()

  vm.context.expect = expect

  const text = await vm.evaluate<Promise<string>>(`
    (() => {
      expect(fetch).toBeDefined();
      fetch = async () => new Response("Hello world");
      return fetch().then(x => x.text())
    })();
  `)
  expect(text).toBe('Hello world')
})
