import { FormData, fetch } from '../fetch'
import { URL } from '../url'

test('perform a POST as application/json', async () => {
  const response = await fetch('https://httpbin.org/post', {
    method: 'POST',
    body: JSON.stringify({ foo: 'bar' }),
    headers: {
      'content-type': 'application/json',
    },
  })

  expect(response.status).toBe(200)
  const json = await response.json()
  expect(JSON.parse(json.data)).toEqual({ foo: 'bar' })
  expect(json.headers['Content-Type']).toBe('application/json')
})

test('perform a POST as application/x-www-form-urlencoded', async () => {
  const response = await fetch('https://httpbin.org/post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ foo: 'bar' }),
  })

  expect(response.status).toBe(200)
  const json = await response.json()
  expect(json.form).toEqual({ foo: 'bar' })
  expect(json.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
})

test('perform a POST as multipart/form-data', async () => {
  const formData = new FormData()
  formData.append('company', 'vercel')
  formData.append('project', 'edge-runtime')

  const response = await fetch('https://httpbin.org/post', {
    method: 'POST',
    body: formData,
  })

  expect(response.status).toBe(200)
  const json = await response.json()
  expect(json.form).toEqual({ company: 'vercel', project: 'edge-runtime' })
  expect(json.headers['Content-Type']).toContain('multipart/form-data')
})

test('sets header calling Headers constructor', async () => {
  const url = new URL('/about', 'https://vercel.com')
  const response = await fetch(url)
  expect(response.status).toBe(200)
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
  expect(response.status).toBe(200)
})
