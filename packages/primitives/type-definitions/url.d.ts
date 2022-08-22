import type { URLPattern } from 'urlpattern-polyfill/dist/types'

declare const URLPatternConstructor: typeof URLPattern
declare const URLConstructor: typeof URL
declare const URLSearchParamsConstructor: typeof URLSearchParams

export {
  URLConstructor as URL,
  URLPatternConstructor as URLPattern,
  URLSearchParamsConstructor as URLSearchParams,
}
