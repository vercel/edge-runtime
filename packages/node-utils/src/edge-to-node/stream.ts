import { Readable } from 'node:stream'

interface FromWebOptions {
  objectMode?: boolean
  highWaterMark?: number
  encoding?: BufferEncoding
  signal?: AbortSignal
}

/**
 * Code adapted from Node's stream.Readable.fromWeb(), because it has to run on Node@14
 * @see https://github.com/nodejs/node/blob/bd462ad81bc30e547e52e699ee3b6fa3d7c882c9/lib/internal/webstreams/adapters.js#L458
 */
export function toToReadable(
  webStream: ReadableStream,
  options: FromWebOptions = {}
) {
  const reader = webStream.getReader()
  let closed = false
  const { highWaterMark, encoding, objectMode = false, signal } = options

  const readable = new Readable({
    objectMode,
    highWaterMark,
    encoding,
    // @ts-ignore signal exist only since Node@17
    signal,
    read() {
      reader.read().then(
        (chunk: any) => {
          if (chunk.done) {
            readable.push(null)
          } else {
            readable.push(chunk.value)
          }
        },
        (error: any) => readable.destroy(error)
      )
    },

    destroy(error: any, callback: (arg0: any) => void) {
      function done() {
        try {
          callback(error)
        } catch (error) {
          // In a next tick because this is happening within
          // a promise context, and if there are any errors
          // thrown we don't want those to cause an unhandled
          // rejection. Let's just escape the promise and
          // handle it separately.
          process.nextTick(() => {
            throw error
          })
        }
      }

      if (!closed) {
        reader.cancel(error).then(done, done)
        return
      }
      done()
    },
  })

  reader.closed.then(
    () => {
      closed = true
    },
    (error: any) => {
      closed = true
      readable.destroy(error)
    }
  )

  return readable
}
