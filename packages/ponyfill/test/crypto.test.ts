import { crypto, TextEncoder } from '..'

test('crypto.randomUUID', async () => {
  expect(crypto.randomUUID()).toEqual(expect.stringMatching(/^[a-f0-9-]+$/))
})

test('crypto.subtle.digest', async () => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode('Hello, world')
  )

  // convert to hex
  const hex = [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // this value is obtained from
  // require('crypto').createHash('sha256').update('Hello, world').digest('hex')
  const expected =
    '4ae7c3b6ac0beff671efa8cf57386151c06e58ca53a78d83f36107316cec125f'

  expect(hex).toEqual(expected)
})
