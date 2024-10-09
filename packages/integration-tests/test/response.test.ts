import { polyfilledOrNative, guard, isEdgeRuntime } from './test-if'

guard(describe, polyfilledOrNative)('response', () => {
  test('create a response', async () => {
    const res1 = new Response('Hello world!')
    expect(await res1.text()).toEqual('Hello world!')
  })

  test('clones responses', async () => {
    const { readable, writable } = new TransformStream()
    const encoder = new TextEncoder()
    const writer = writable.getWriter()

    void writer.write(encoder.encode('Hello '))
    void writer.write(encoder.encode('world!'))
    void writer.close()

    const res1 = new Response(readable)
    const res2 = res1.clone()

    expect(await res1.text()).toEqual('Hello world!')
    expect(await res2.text()).toEqual('Hello world!')
  })

  test('reads response body as buffer', async () => {
    const response = await fetch('https://example.vercel.sh')
    const arrayBuffer = await response.arrayBuffer()
    const text = new TextDecoder().decode(arrayBuffer)
    expect(text).toMatch(/^<!doctype html>/i)

    const doctype = new TextEncoder().encode('<!doctype html>')
    const partial = new Uint8Array(arrayBuffer).slice(0, doctype.length)

    expect([...partial]).toEqual([...new Uint8Array(doctype)])
  })

  test('allow to set `set-cookie` header', async () => {
    const response = new Response(null)
    response.headers.set('set-cookie', 'foo=bar')
    expect(response.headers.get('set-cookie')).toEqual('foo=bar')
  })

  guard(test, isEdgeRuntime)(
    'allow to append multiple `set-cookie` header',
    async () => {
      const response = new Response(null)
      response.headers.append('set-cookie', 'foo=bar')
      response.headers.append('set-cookie', 'bar=baz')
      expect(response.headers.getSetCookie()).toEqual(['foo=bar', 'bar=baz'])
      expect(response.headers.getAll?.('set-cookie')).toEqual([
        'foo=bar',
        'bar=baz',
      ])
    },
  )

  test('disallow mutate response headers for redirects', async () => {
    const response = Response.redirect('https://edge-ping.vercel.app/')
    expect(() => response.headers.set('foo', 'bar')).toThrow('immutable')
  })

  guard(test, isEdgeRuntime)(
    'allow to mutate response headers for error',
    async () => {
      const response = Response.error()
      response.headers.set('foo', 'bar')
      expect(response.headers.get('foo')).toEqual('bar')
    },
  )
})
