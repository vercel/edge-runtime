import { fetch, Request, Headers } from '@edge-runtime/ponyfill'

test('combine with fetch', async () => {
  const request = new Request('https://example.vercel.sh')
  const response = await fetch(request)
  const body = await response.text()
  expect(typeof body === 'string').toBe(true)
})

test('combine with Headers', async () => {
  const headers = new Headers({ cookie: 'hello=world' })
  const request = new Request('https://example.vercel.sh', {
    headers,
  })
  expect(request.headers.get('cookie')).toBe('hello=world')
})

test('serialize body into JSON', async () => {
  const obj = { hello: 'world' }
  const request = new Request('https://example.vercel.sh', {
    method: 'POST',
    body: JSON.stringify(obj),
  })

  const data = await request.json()
  expect(data).toEqual(obj)
})

test('adds duplex: half to all requests', () => {
  const request = new Request('https://example.vercel.sh')
  // @ts-expect-error duplex is not defined on Request
  expect(request.duplex).toBe('half')
})

test('can be extended', async () => {
  class SubRequest extends Request {
    constructor(input: Request | string, init?: RequestInit) {
      super(input, init)
    }

    myField = 'default value'

    setField(value: string) {
      this.myField = value
    }
  }

  const request = new SubRequest('https://example.vercel.sh', {
    headers: { 'x-test': 'hello' },
  })

  // @ts-expect-error duplex is not defined on Request
  expect(request.duplex).toBe('half')
  expect(request.myField).toBe('default value')
  request.setField('new value')
  expect(request.myField).toBe('new value')

  expect(request.headers.get('x-test')).toBe('hello')
  expect(request).toBeInstanceOf(Request)
})
