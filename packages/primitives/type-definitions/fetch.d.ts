export class Headers extends globalThis.Headers {
  getAll?(key: 'set-cookie'): string[]
}

export class Request extends globalThis.Request {
  readonly headers: Headers
}

export class Response extends globalThis.Response {
  readonly headers: Headers
  static json(data: any, init?: ResponseInit): Response
}

export type RequestInfo = Parameters<typeof fetch>[0]
export type RequestInit = Parameters<typeof fetch>[1]
declare const fetchImplementation: (
  info: RequestInfo,
  init?: RequestInit
) => Promise<Response>

declare const FileConstructor: typeof File
declare const FormDataConstructor: typeof FormData

export { fetchImplementation as fetch }
export { FileConstructor as File }
export { FormDataConstructor as FormData }
