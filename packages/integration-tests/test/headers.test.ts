describe('headers', () => {
  it.each([
    ['host', 'vercel.com'],
    ['content-length', '1234'],
    ['content-type', 'application/json'],
    ['transfer-encoding', 'chunked'],
    ['connection', 'keep-alive'],
    ['keep-alive', 'timeout=5'],
    ['upgrade', 'websocket'],
    ['expect', '100-continue'],
  ])("sets '%s' header in the constructor", async (name, value) => {
    const headers = new Headers({ [name]: value })
    expect(headers.get(name)).toBe(value)
  })

  it('sets header calling Headers constructor', async () => {
    const headers = new Headers()
    headers.set('cookie', 'hello=world')
    expect(headers.get('cookie')).toBe('hello=world')
  })

  it('multiple headers', async () => {
    const headers = new Headers()
    headers.append('set-cookie', 'foo=chocochip')
    headers.append('set-cookie', 'bar=chocochip')
    expect(headers.get('set-cookie')).toBe('foo=chocochip, bar=chocochip')
    expect([...headers]).toEqual([
      ['set-cookie', 'foo=chocochip'],
      ['set-cookie', 'bar=chocochip'],
    ])
  })

  describe('iterators', () => {
    const generate = () => {
      const headers = new Headers()
      headers.append('a', '1')
      headers.append('b', '2')
      headers.append('set-cookie', 'c=3')
      headers.append('set-cookie', 'd=4')
      return headers
    }

    test('#Symbol.iterator', () => {
      const entries = [...generate()]
      expect(entries).toEqual([
        ['a', '1'],
        ['b', '2'],
        ['set-cookie', 'c=3'],
        ['set-cookie', 'd=4'],
      ])
    })

    test('#entries', () => {
      const entries = [...generate().entries()]
      expect(entries).toEqual([
        ['a', '1'],
        ['b', '2'],
        ['set-cookie', 'c=3'],
        ['set-cookie', 'd=4'],
      ])
    })

    test('#values', () => {
      const values = [...generate().values()]
      expect(values).toEqual(['1', '2', 'c=3', 'd=4'])
    })
  })
})
