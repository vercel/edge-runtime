import { EdgeVM } from '../../src'

test('crypto.subtle.digest returns an ArrayBuffer', async () => {
  const vm = new EdgeVM()

  async function fn() {
    const digest = await crypto.subtle.digest(
      'SHA-256',
      crypto.getRandomValues(new Uint8Array(32)),
    )
    return digest
  }

  const fromContext = vm.evaluate(`({ ArrayBuffer })`)

  const digest = await vm.evaluate(`(${fn})()`)
  expect(digest).toBeInstanceOf(fromContext.ArrayBuffer)
})

test('crypto.generateKey works with a Uint8Array from the VM', async () => {
  async function fn() {
    await crypto.subtle.generateKey(
      {
        name: 'RSA-PSS',
        hash: 'SHA-256',
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        modulusLength: 2048,
      },
      false,
      ['sign', 'verify'],
    )
  }

  const vm = new EdgeVM()
  await vm.evaluate(`(${fn})()`)
})
