import { EdgeVM } from '../../src'
import { createHash } from 'crypto'

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

test('crypto.subtle.digest returns a SHA-256 hash', async () => {
  const vm = new EdgeVM()

  async function fn() {
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new Uint8Array([104, 105, 33])
    )
    return digest
  }

  const digest = await vm.evaluate(`(${fn})()`)
  expect(toHex(digest)).toEqual(
    createHash('sha256').update('hi!').digest('hex')
  )
})

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const nodeMajorVersion = parseInt(process.versions.node.split('.')[0])
if (nodeMajorVersion >= 16) {
  test('Ed25519', async () => {
    const vm = new EdgeVM()

    function fn() {
      return crypto.subtle.generateKey('Ed25519', false, ['sign', 'verify'])
    }

    const kp = await vm.evaluate(`(${fn})()`)
    expect(kp).toHaveProperty('privateKey')
    expect(kp).toHaveProperty('publicKey')
  })

  test('X25519', async () => {
    const vm = new EdgeVM()

    function fn() {
      return crypto.subtle.generateKey('X25519', false, ['deriveBits', 'deriveKey'])
    }

    const kp = await vm.evaluate(`(${fn})()`)
    expect(kp).toHaveProperty('privateKey')
    expect(kp).toHaveProperty('publicKey')
  })
}
