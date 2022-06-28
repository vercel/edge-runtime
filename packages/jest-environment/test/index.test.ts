/**
 * @jest-environment ./dist
 */
test('TextEncoder references the same global Uint8Array constructor', () => {
  expect(new TextEncoder().encode('abc')).toBeInstanceOf(Uint8Array)
})

test('allows to run fetch', async () => {
  const response = await fetch('https://vercel.com')
  expect(response.status).toEqual(200)
})

test('allows to run crypto', async () => {
  const array = new Uint32Array(10)
  expect(crypto.getRandomValues(array)).toHaveLength(array.length)
})
