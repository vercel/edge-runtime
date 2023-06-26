import type { IncomingMessage } from 'http'
import type { Writable } from 'stream'
import { Readable } from 'stream'

type BodyStream = ReadableStream<Uint8Array>

/**
 * An interface that encapsulates body stream cloning
 * of an incoming request.
 */
export function getClonableBodyStream<T extends IncomingMessage>(
  incomingMessage: T,
  KUint8Array: typeof Uint8Array,
  KTransformStream: typeof TransformStream
) {
  let bufferedBodyStream: BodyStream | null = null

  return {
    /**
     * Replaces the original request body if necessary.
     * This is done because once we read the body from the original request,
     * we can't read it again.
     */
    finalize(): void {
      if (bufferedBodyStream) {
        replaceRequestBody(
          incomingMessage,
          bodyStreamToNodeStream(bufferedBodyStream)
        )
      }
    },
    /**
     * Clones the body stream
     * to pass into a middleware
     */
    cloneBodyStream(): BodyStream {
      const originalStream =
        bufferedBodyStream ??
        requestToBodyStream(incomingMessage, KUint8Array, KTransformStream)
      const [stream1, stream2] = originalStream.tee()
      bufferedBodyStream = stream1
      return stream2
    },
  }
}

/**
 * Creates a ReadableStream from a Node.js HTTP request
 */
function requestToBodyStream(
  request: IncomingMessage,
  KUint8Array: typeof Uint8Array,
  KTransformStream: typeof TransformStream
): BodyStream {
  const transform = new KTransformStream<Uint8Array, Uint8Array>({
    start(controller) {
      request.on('data', (chunk) =>
        controller.enqueue(new KUint8Array([...new Uint8Array(chunk)]))
      )
      request.on('end', () => controller.terminate())
      request.on('error', (err) => controller.error(err))
    },
  })

  return transform.readable as unknown as ReadableStream<Uint8Array>
}

function bodyStreamToNodeStream(bodyStream: BodyStream): Readable {
  const reader = bodyStream.getReader()
  return Readable.from(
    (async function* () {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          return
        }
        yield value
      }
    })()
  )
}

function replaceRequestBody<T extends IncomingMessage>(
  base: T,
  stream: Readable
): T {
  for (const key in stream) {
    let v = stream[key as keyof Readable] as any
    if (typeof v === 'function') {
      v = v.bind(stream)
    }
    base[key as keyof T] = v
  }

  return base
}

function isUint8ArrayChunk(value: any): value is Uint8Array {
  return value?.constructor?.name == 'Uint8Array'
}

/**
 * Creates an async iterator from a ReadableStream that ensures that every
 * emitted chunk is a `Uint8Array`. If there is some invalid chunk it will
 * throw.
 */
export async function* consumeUint8ArrayReadableStream(body?: ReadableStream) {
  const reader = body?.getReader()
  if (reader) {
    let error
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          return
        }

        if (!isUint8ArrayChunk(value)) {
          error = new TypeError('This ReadableStream did not return bytes.')
          break
        }
        yield value
      }
    } finally {
      if (error) {
        reader.cancel(error)
        throw error
      } else {
        reader.cancel()
      }
    }
  }
}

/**
 * Pipes the chunks of a BodyStream into a Response. This optimizes for
 * laziness, pauses reading if we experience back-pressure, and handles early
 * disconnects by the client on the other end of the server response.
 */
export async function pipeBodyStreamToResponse(
  body: BodyStream | null,
  res: Writable
) {
  if (!body) return

  // If the client has already disconnected, then we don't need to pipe anything.
  if (res.destroyed) return body.cancel()

  // When the server pushes more data than the client reads, then we need to
  // wait for the client to catch up before writing more data. We register this
  // generic handler once so that we don't incur constant register/unregister
  // calls.
  let drainResolve: () => void
  res.on('drain', () => drainResolve?.())

  // If the user aborts, then we'll receive a close event before the
  // body closes. In that case, we want to end the streaming.
  let open = true
  res.on('close', () => {
    open = false
    drainResolve?.()
  })

  const reader = body.getReader()
  while (open) {
    const { done, value } = await reader.read()
    if (done) break

    if (!isUint8ArrayChunk(value)) {
      const error = new TypeError('This ReadableStream did not return bytes.')
      reader.cancel(error)
      throw error
    }

    if (open) {
      const bufferSpaceAvailable = res.write(value)

      // If there's no more space in the buffer, then we need to wait on the
      // client to read data before pushing again.
      if (!bufferSpaceAvailable) {
        await new Promise<void>((res) => {
          drainResolve = res
        })
      }
    }

    // If the client disconnected early, then we need to cleanup the stream.
    // This cannot be joined with the above if-statement, because the client may
    // have disconnected while waiting for a drain signal.
    if (!open) {
      return reader.cancel()
    }
  }
}
