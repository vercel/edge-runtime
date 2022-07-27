import { URL } from '../url'

test('URL', async () => {
  const url = new URL('https://edge-ping.vercel.app/')
  expect(typeof url).toBe('object')
  expect(url.toString()).toBe('https://edge-ping.vercel.app/')
})
