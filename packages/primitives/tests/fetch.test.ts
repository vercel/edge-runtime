import { fetch } from '../fetch'
import { URL } from '../url'

test('sets header calling Headers constructor', async () => {
  const url = new URL('/about', 'https://vercel.com');
  const response = await fetch(url)
  expect(response.status).toEqual(200)
})
