export class Headers extends globalThis.Headers {
  getSetCookie?(): string[]
}

export class Request extends globalThis.Request {
  readonly headers: Headers
}

export class Response extends globalThis.Response {
  readonly headers: Headers
  static json(data: any, init?: ResponseInit): Response
}

type RequestInfo = globalThis.RequestInfo | URL
type RequestInit = globalThis.RequestInit | undefined
declare const fetchImplementation: (
  info: RequestInfo,
  init?: RequestInit
) => Promise<Response>

declare const FileConstructor: typeof File
declare const FormDataConstructor: typeof FormData

export { fetchImplementation as fetch }
export { FileConstructor as File }
export { FormDataConstructor as FormData }
