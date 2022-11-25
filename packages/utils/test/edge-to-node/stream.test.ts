import { ReadableStream } from '@edge-runtime/primitives'
import { Readable } from 'node:stream'
import { transformToReadable } from '../../src'

describe('transformToReadable()', () => {
  it('handles a web ReadableStream', async () => {
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        controller.enqueue(encoder.encode('hello'))
        await new Promise((resolve) => setTimeout(resolve, 200))
        controller.enqueue(encoder.encode(' world'))
        controller.close()
      },
    })

    const readable = transformToReadable(readableStream)
    expect((await transformToBuffer(readable)).toString()).toEqual(
      'hello world'
    )
  })
})

async function transformToBuffer(stream: Readable) {
  const buffers = []
  for await (const data of stream) {
    buffers.push(data)
  }
  return Buffer.concat(buffers)
}
