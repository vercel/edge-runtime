import primitives from '../dist'

test('combine with fetch', async () => {
  const request = new primitives.Request('https://example.vercel.sh')
  const response = await primitives.fetch(request)
  const body = await response.text()
  expect(typeof body === 'string').toBe(true)
})

test('combine with Headers', async () => {
  const headers = new primitives.Headers({ cookie: 'hello=world' })
  const request = new primitives.Request('https://example.vercel.sh', {
    headers,
  })
  expect(request.headers.get('cookie')).toBe('hello=world')
})
