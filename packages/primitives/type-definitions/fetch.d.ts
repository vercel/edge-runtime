import { Headers as HeadersBase } from 'undici'

export class Headers extends HeadersBase {
  getAll(key: 'set-cookie'): string[]
}

declare const fetchImplementation: typeof fetch
declare const FileConstructor: typeof File
declare const FormDataConstructor: typeof FormData

export { fetchImplementation as fetch }
export { FileConstructor as File }
export { FormDataConstructor as FormData }

export {
  BodyInit,
  HeadersInit,
  ReferrerPolicy,
  Request,
  RequestCache,
  RequestCredentials,
  RequestDestination,
  RequestInfo,
  RequestInit,
  RequestMode,
  RequestRedirect,
  Response,
  ResponseRedirectStatus,
  ResponseType,
} from 'undici'
