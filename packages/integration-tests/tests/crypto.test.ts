import { crypto } from '@edge-runtime/ponyfill'

test('crypto.randomUUID', () => {
  expect(crypto.randomUUID()).toEqual(expect.stringMatching(/^[a-f0-9-]+$/))
})
