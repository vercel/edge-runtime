import { createHash } from 'crypto'

if (!globalThis.crypto) {
  globalThis.crypto = require('crypto')
}

const testOrSkip =
  process.versions.node.split('.').map(Number)[0] > 16 ? test : test.skip

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

test('crypto.randomUUID', async () => {
  expect(crypto.randomUUID()).toEqual(expect.stringMatching(/^[a-f0-9-]+$/))
})

testOrSkip('crypto.subtle.digest returns a SHA-256 hash', async () => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new Uint8Array([104, 105, 33]),
  )
  expect(toHex(digest)).toEqual(
    createHash('sha256').update('hi!').digest('hex'),
  )
})

testOrSkip('Ed25519', async () => {
  const kp = await crypto.subtle.generateKey('Ed25519', false, [
    'sign',
    'verify',
  ])
  expect(kp).toHaveProperty('privateKey')
  expect(kp).toHaveProperty('publicKey')
})

testOrSkip('X25519', async () => {
  const kp = await crypto.subtle.generateKey('X25519', false, [
    'deriveBits',
    'deriveKey',
  ])
  expect(kp).toHaveProperty('privateKey')
  expect(kp).toHaveProperty('publicKey')
})
