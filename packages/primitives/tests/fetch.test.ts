import { fetch } from '../fetch'
import { URL } from '../url'

test('perform a POST as application/json', async () => {
  const response = await fetch('https://httpbin.org/post', {
    method: 'POST',
    body: JSON.stringify({ foo: 'bar' }),
    headers: {
      'content-type': 'application/json',
    },
  })

  expect(response.status).toEqual(200)
  const json = await response.json()
  expect(JSON.parse(json.data).foo).toBe('bar')
})

test('perform a POST as application/x-www-form-urlencoded', async () => {
  const response = await fetch('https://httpbin.org/post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ foo: 'bar' }),
  })

  expect(response.status).toEqual(200)
  const json = await response.json()
  expect(json.form.foo).toBe('bar')
})

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
