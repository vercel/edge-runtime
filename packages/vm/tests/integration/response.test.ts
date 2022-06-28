/**
 * @jest-environment ../jest-environment/dist
 */
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
