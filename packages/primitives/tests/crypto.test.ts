import { crypto } from '../crypto'

test('crypto.randomUUID', () => {
  expect(crypto.randomUUID()).toEqual(expect.stringMatching(/^[a-f0-9-]+$/))
})
