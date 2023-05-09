export class Headers extends globalThis.Headers {
  getAll?(key: 'set-cookie'): string[]
}

export class Request extends globalThis.Request {
  readonly headers: Headers
  readonly duplex: string
}

export class Response extends globalThis.Response {
  readonly headers: Headers
  static json(data: any, init?: ResponseInit): Response
}

export type RequestInfo = string | Request | globalThis.Request
export type RequestInit = globalThis.RequestInit
declare const fetchImplementation: (
  info: RequestInfo,
  init?: RequestInit
) => Promise<Response>

declare const FileConstructor: typeof File
declare const FormDataConstructor: typeof FormData
declare const WebSocketConstructor: typeof WebSocket

export { fetchImplementation as fetch }
export { FileConstructor as File }
export { FormDataConstructor as FormData }
export { WebSocketConstructor as WebSocket }
