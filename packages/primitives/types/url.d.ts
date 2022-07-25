import type { URLPattern } from 'urlpattern-polyfill/dist/types'

declare const URLPatternConstructor: typeof URLPattern
declare const URLConstructor: URL
declare const URLSearchParamsConstructor: URLSearchParams

export { URLPatternConstructor as URLPattern }
export { URLConstructor as URL }
export { URLSearchParamsConstructor as URLSearchParams }
