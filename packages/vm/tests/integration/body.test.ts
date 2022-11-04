/**
 * @jest-environment ../jest-environment/dist
 */
it('throws when the body was directly consumed', async () => {
  const object = { hello: 'world' }
  const blob = new Blob([JSON.stringify(object, null, 2)], {
    type: 'application/json',
  })

  const formData = new FormData()
  formData.append('name', 'John')
  formData.append('lastname', 'Doe')
  formData.append('metadata', blob)

  const response = new Response(formData)

  async function* streamToIterator<T>(
    readable: ReadableStream<T>
  ): AsyncIterableIterator<T> {
    const reader = readable.getReader()
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      if (value != null) {
        yield value
      }
    }
    reader.releaseLock()
  }

  // @ts-expect-error
  for await (const item of streamToIterator(response.body)) {
    expect(item).toBeTruthy()
  }

  // @ts-expect-error
  const reader = response.body.getReader()
  const { done } = await reader.read()

  expect(done).toBeTruthy()

  const error = await response.text().catch((err) => err)

  expect(error).toBeInstanceOf(TypeError)
  expect(error.message).toEqual('The stream is locked.')
})

test('throws when the body was indirectly consumed', async () => {
  const object = { hello: 'world' }
  const blob = new Blob([JSON.stringify(object, null, 2)], {
    type: 'application/json',
  })

  const formData = new FormData()
  formData.append('name', 'John')
  formData.append('lastname', 'Doe')
  formData.append('metadata', blob)

  const response = new Response(formData)
  const text = await response.text()

  expect(text).toBeTruthy()

  const error = await response.text().catch((err) => err)

  expect(error).toBeInstanceOf(TypeError)
  expect(error.message).toEqual('The body has already been consumed.')
})

test('allows to read a FormData body as text', async () => {
  const object = { hello: 'world' }
  const blob = new Blob([JSON.stringify(object, null, 2)], {
    type: 'application/json',
  })

  const formData = new FormData()
  formData.append('name', 'John')
  formData.append('lastname', 'Doe')
  formData.append('metadata', blob)

  const res = new Response(formData)
  const text = await res?.text()

  expect(text.replace(/formdata-undici-0\.\d+/g, 'formdata-unidici-0.1234'))
    .toMatchInlineSnapshot(`
    "------formdata-unidici-0.1234
    Content-Disposition: form-data; name="name"

    John
    ------formdata-unidici-0.1234
    Content-Disposition: form-data; name="lastname"

    Doe
    ------formdata-unidici-0.1234
    Content-Disposition: form-data; name="metadata"; filename="blob"
    Content-Type: application/json

    {
      "hello": "world"
    }
    ------formdata-unidici-0.1234--"
  `)
})

test('allows to read a null body as ArrayBuffer', async () => {
  const response = new Response(null)
  const buffer = await response.arrayBuffer()
  expect(buffer.byteLength).toEqual(0)
  expect(new Uint8Array(buffer).byteLength).toEqual(0)
})

test('allows to read a text body as ArrayBuffer', async () => {
  const response = new Response('Hello world')
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const value = await response.arrayBuffer()
  const decoded = decoder.decode(value)

  expect(decoded).toEqual('Hello world')
  expect(value).toEqual(encoder.encode('Hello world').buffer)
})

test('allows to read a chunked body as ArrayBuffer', async () => {
  const { readable, writable } = new TransformStream()
  const encoder = new TextEncoder()
  const writer = writable.getWriter()

  void writer.write(encoder.encode('Hello '))
  void writer.write(encoder.encode('world!'))
  void writer.close()

  const response = new Response(readable)
  const value = await response.arrayBuffer()
  const decoder = new TextDecoder()
  const decoded = decoder.decode(value)

  expect(decoded).toEqual('Hello world!')
  expect(value).toEqual(encoder.encode('Hello world!').buffer)
})

test('should pend stream data before getReader is called', async () => {
  let startPulling = false
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const readable = new ReadableStream({
    start(controller) {
      // delay streaming enqueue to trigger pulling
      setTimeout(() => {
        controller.enqueue(encoder.encode('hello'))
        controller.enqueue(encoder.encode('world'))
      }, 500)
    },
    pull() {
      startPulling = true
    },
  })

  expect(startPulling).toBe(false)
  const reader = readable.getReader()

  // Delay timer to trigger pulling
  await new Promise((resolve) => setTimeout(resolve, 500))
  // pulling should start after getReader is called
  expect(startPulling).toBe(true)

  let result = await reader.read()

  expect(decoder.decode(result.value)).toBe('hello')
  result = await reader.read()
  expect(decoder.decode(result.value)).toBe('world')
})

test('allows to read a URLSearchParams body as FormData', async () => {
  const params = new URLSearchParams('q=URLUtils.searchParams&topic=api')
  const response = new Response(params)
  const formData = await response.formData()
  expect(formData.get('topic')).toEqual('api')
})

test('allows to read a Blob body as Blob', async () => {
  const object = { hello: 'world' }
  const str = JSON.stringify(object, null, 2)
  const response = new Response(new Blob([str]))
  const blob = await response.blob()
  const txt = await blob.text()
  expect(txt).toEqual(str)
})

test('allows to read a text body as JSON', async () => {
  const response = new Response(JSON.stringify({ message: 'hi', value: 10 }))
  const value = await response.json()
  expect(value).toStrictEqual({ message: 'hi', value: 10 })
})

test('throws when reading a text body as JSON but it is invalid', async () => {
  const response = new Response('{ hi: "there", ')
  const error = await response.json().catch((err) => err)
  expect(error).toBeInstanceOf(SyntaxError)
  expect(error.message).toEqual('Unexpected token h in JSON at position 2')
})

test('streams Uint8Array that can be decoded into a string', async () => {
  const response = await fetch('https://example.vercel.sh')
  const reader = response.body.getReader()
  let value: string = ''
  const decoder = new TextDecoder()
  while (true) {
    const { done, value: chunk } = await reader.read()
    if (done) {
      break
    }
    value += decoder.decode(chunk)
  }
  expect(value).toContain('Example Domain')
})
