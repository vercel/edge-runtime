import type { IncomingMessage } from 'http'
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

/**
 * Creates an async iterator from a ReadableStream that ensures that every
 * emitted chunk is a `Uint8Array`. If there is some invalid chunk it will
 * throw.
 */
export async function* consumeUint8ArrayReadableStream(body?: ReadableStream) {
  const reader = body?.getReader()
  if (reader) {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        return
      }

      if (value?.constructor?.name !== 'Uint8Array') {
        throw new TypeError('This ReadableStream did not return bytes.')
      }

      yield value as Uint8Array
    }
  }
}
