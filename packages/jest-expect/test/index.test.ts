describe('Request matchers', () => {
  test('`expect.toHaveJSONBody` available', async () => {
    const json = { foo: 'bar' }
    const request = new Request('http://n', {
      body: JSON.stringify(json),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    await expect(request).toHaveJSONBody(json)
    await expect(request).not.toHaveJSONBody({ foo: 'baz' })
  })

  test('`expect.toHaveTextBody` available', async () => {
    const request1 = new Request('http://n', { body: '', method: 'POST' })
    await expect(
      expect(request1).toHaveTextBody('Does not have this text')
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"expected text body '' to be 'Does not have this text'"`
    )

    const text = 'Does have this text'
    const request2 = new Request('http://n', { body: text, method: 'POST' })

    await expect(request2).toHaveTextBody(text)
    await expect(request2).not.toHaveTextBody('Does not have this text')
  })
})

describe('Response matchers', () => {
  test('`expect.toHaveStatus` available', () => {
    const okResponse = new Response('OK')

    expect(okResponse).toHaveStatus(200)
    expect(okResponse).toHaveStatus('Successful')
    expect(okResponse).not.toHaveStatus(201)

    expect(new Response('Internal Server Error', { status: 500 })).toHaveStatus(
      'Server Error'
    )
  })

  test('`expect.toHaveJSONBody` available', async () => {
    await expect(
      expect(new Response('Without Content-Type')).toHaveJSONBody(null)
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      "expect(received).toHaveJSONBody(expected)

      Expected response to have "Content-Type": "application/json"
      Received: "text/plain;charset=UTF-8""
    `)

    const json = { foo: 'bar' }
    // @ts-expect-error See https://developer.mozilla.org/en-US/docs/Web/API/Response/json
    const response = Response.json(json)

    await expect(response).toHaveJSONBody(json)
    await expect(response).not.toHaveJSONBody({ foo: 'baz' })
  })

  test('`expect.toHaveTextBody` available', async () => {
    const text = 'Does have this text'
    const response = new Response(text)

    await expect(response).toHaveTextBody(text)
    await expect(response).not.toHaveTextBody("Doesn't have this text")
  })
})
