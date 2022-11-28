import type { Readable } from 'node:stream'

interface Dependencies {
  ReadableStream: typeof ReadableStream
  Uint8Array: typeof Uint8Array
}

export function buildToReadableStream(dependencies: Dependencies) {
  const { ReadableStream, Uint8Array } = dependencies
  return function toReadableStream(stream: Readable): ReadableStream {
    return new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => {
          controller.enqueue(new Uint8Array([...new Uint8Array(chunk)]))
        })
        stream.on('end', () => {
          controller.close()
        })
        stream.on('error', (err) => {
          controller.error(err)
        })
      },
    })
  }
}
