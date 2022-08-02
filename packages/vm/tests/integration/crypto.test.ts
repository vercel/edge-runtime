import { EdgeVM } from '../../src'

test('crypto.subtle.digest returns an ArrayBuffer', async () => {
  const vm = new EdgeVM()

  async function fn() {
    const digest = await crypto.subtle.digest(
      'SHA-256',
      crypto.getRandomValues(new Uint8Array(32))
    )
    return digest
  }

  const fromContext = vm.evaluate(`({ ArrayBuffer })`)

  const digest = await vm.evaluate(`(${fn})()`)
  expect(digest).toBeInstanceOf(fromContext.ArrayBuffer)
})
