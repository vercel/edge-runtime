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
  if (!body) {
    return
  }

  const reader = body.getReader()

  // If the consumer calls `it.return()`, our generator code's `yield` will
  // perform an AbruptCompletion and behave as if this was a `return` statement.
  // To ensure we perform cleanup, we need to guard the yield statement and
  // detect this condition with a try-finally.
  let needsCleanup = false

  // If we detect an invalid chunk, we store an error to be thrown as part of
  // the cleanup phase.
  let invalidChunkError

  try {
    while (true) {
      // If the read errors, or we are done reading, we do not need to cleanup
      // further.
      const { done, value } = await reader.read()
      if (done) {
        return
      }

      // We also need to cleanup if the user returned an invalid type. The loop
      // isn't done yet, but we're not going to be reading any more.
      needsCleanup = true

      if (value?.constructor?.name !== 'Uint8Array') {
        invalidChunkError = new TypeError(
          'This ReadableStream did not return bytes.'
        )
        break
      }

      yield value as Uint8Array
      needsCleanup = false
    }
  } finally {
    // The reader either returned an invalid chunk, or our consumer early
    // exited. In either case, we need to cleanup the stream's resources.
    if (needsCleanup) {
      reader.cancel(invalidChunkError)
    }
    if (invalidChunkError) {
      throw invalidChunkError
    }
  }
}
