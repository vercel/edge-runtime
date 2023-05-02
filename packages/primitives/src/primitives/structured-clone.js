import structuredClone_ from '@ungap/structured-clone'

export function structuredClone(value, options) {
  if (value instanceof ReadableStream) {
    const transform = new TransformStream({})
    value.pipeTo(transform.writable)
    return transform.readable
  }

  return structuredClone_(value, options)
}
