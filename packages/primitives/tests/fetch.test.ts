import { fetch } from '../fetch'
import { URL } from '../url'

test('sets header calling Headers constructor', async () => {
  const url = new URL('/about', 'https://vercel.com')
  const response = await fetch(url)
  expect(response.status).toEqual(200)
})

test('sets headers unsupported in undici', async () => {
  const url = new URL('/', 'https://example.com')
  const response = await fetch(url, {
    headers: {
      Connection: 'keep-alive',
      'Keep-Alive': 'timeout=5, max=1000',
      'Transfer-Encoding': 'gzip',
    },
  })
  expect(response.status).toEqual(200)
})
