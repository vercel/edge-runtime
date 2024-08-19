import { aboveNode16, guard } from './test-if'

guard(describe, aboveNode16)('request', () => {
  test('evaluate promise', () => {
    const url = 'https://vercel.com/foo/bar?one=value'
    const req = new Request(url)
    expect(req.url).toEqual(url)
  })

  test('parses and reconstructs the URL alone', () => {
    const url = 'https://vercel.com/foo/bar?one=value'
    const req = new Request(url)
    expect(req.url).toEqual(url)
  })

  test('throws when the URL is malformed', () => {
    try {
      void new Request('meeeh')
    } catch (error: any) {
      expect(error.message).toEqual('Failed to parse URL from meeeh')
    }
  })

  test('Request.referrer is `about:client` by default', () => {
    const request = new Request('https://example.vercel.sh')
    expect(request.referrer).toEqual('about:client')
  })

  test('Request.referrer can be customized', () => {
    const request = new Request('https://example.vercel.sh', {
      referrer: 'https://vercel.com/home',
    })
    expect(request.referrer).toEqual('https://vercel.com/home')
  })

  test('create a Request instance using second argument', () => {
    expect(
      new Request(
        'https://example.vercel.sh',
        new Request('https://example.vercel.sh', { method: 'POST' }),
      ).method,
    ).toBe('POST')
  })

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

    expect(request.duplex).toBe('half')
    expect(request.myField).toBe('default value')
    request.setField('new value')
    expect(request.myField).toBe('new value')

    expect(request.headers.get('x-test')).toBe('hello')
    expect(request).toBeInstanceOf(Request)
  })
})
