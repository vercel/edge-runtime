import { createServer } from 'http'
import listen from 'test-listen'
import { EdgeVM } from '../src'

test('fetch within vm', async () => {
  const server = createServer((req, res) => {
    res.write(`Hello from ${req.url}`)
    res.end()
  })
  try {
    const url = await listen(server)
    const vm = new EdgeVM()

    const result = await vm.evaluate(`fetch("${url}/foo")`)
    expect(await result.text()).toBe(`Hello from /foo`)
  } finally {
    server.close()
  }
})

test('sends a Uint8Array', async () => {
  const server = createServer(async (req, res) => {
    const chunks = [] as Buffer[]
    for await (const chunk of req) {
      chunks.push(chunk)
    }
    const body = Buffer.concat(chunks).toString()
    res.write(`Hello from ${req.url} with body ${body}`)
    res.end()
  })
  try {
    const url = await listen(server)
    const vm = new EdgeVM()

    const result = await vm.evaluate(
      `fetch("${url}/foo", { method: "POST", body: new Uint8Array([104, 105, 33]) })`
    )
    expect(await result.text()).toBe(`Hello from /foo with body hi!`)
  } finally {
    server.close()
  }
})
