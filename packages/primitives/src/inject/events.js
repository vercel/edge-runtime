const primitive = (x) =>
  globalThis[Symbol.for('@edge-runtime/primitives')]?.[x] ?? globalThis[x]

export const Event = primitive('Event')
export const AbortController = primitive('AbortController')
export const EventTarget = primitive('EventTarget')

const ts = primitive('TransformStream')
const rs = primitive('ReadableStream')

export {
  ts as __vc_globalthis__TransformStream__,
  rs as __vc_globalthis__ReadableStream__,
}
