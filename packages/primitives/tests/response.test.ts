import { fetch, Response } from '../fetch'

test('allow to set `set-cookie` header', async () => {
  const response = new Response(null)
  response.headers.set('set-cookie', 'foo=bar')
  expect(response.headers.get('set-cookie')).toEqual('foo=bar')
})

test('allow to append multiple `set-cookie` header', async () => {
  const response = new Response(null)
  response.headers.append('set-cookie', 'foo=bar')
  response.headers.append('set-cookie', 'bar=baz')
  expect(response.headers.getAll('set-cookie')).toEqual(['foo=bar', 'bar=baz'])
})

test('disallow mutate response headers for redirects', async () => {
  const response = Response.redirect('https://edge-ping.vercel.app/')
  expect(() => response.headers.set('foo', 'bar')).toThrow('immutable')
})

test('allow to mutate response headers for error', async () => {
  const response = Response.error()
  response.headers.set('foo', 'bar')
  expect(response.headers.get('foo')).toEqual('bar')
})

test('allow to mutate response headers', async () => {
  const response = await fetch('https://edge-ping.vercel.app/')
  response.headers.set('foo', 'bar')
  expect(response.headers.get('foo')).toEqual('bar')
})
