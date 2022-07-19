import type { ReadableStreamBYOBReader } from 'web-streams-polyfill'

declare const ReadableStreamConstructor: typeof ReadableStream
declare const ReadableStreamBYOBReaderConstructor: typeof ReadableStreamBYOBReader
declare const ReadableStreamDefaultReaderConstructor: typeof ReadableStreamDefaultReader
declare const TransformStreamConstructor: typeof TransformStream
declare const WritableStreamConstructor: typeof WritableStream
declare const WritableStreamDefaultWriterConstructor: typeof WritableStreamDefaultWriter

export { ReadableStreamConstructor as ReadableStream }
export { ReadableStreamBYOBReaderConstructor as ReadableStreamBYOBReader }
export { ReadableStreamDefaultReaderConstructor as ReadableStreamDefaultReader }
export { TransformStreamConstructor as TransformStream }
export { WritableStreamConstructor as WritableStream }
export { WritableStreamDefaultWriterConstructor as WritableStreamDefaultWriter }
