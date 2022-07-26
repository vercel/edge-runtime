import type { URLPattern } from 'urlpattern-polyfill/dist/types'

declare const URLPatternConstructor: typeof URLPattern
declare const URLConstructor: typeof URL
declare const URLSearchParamsConstructor: typeof URLSearchParams

export { URLPatternConstructor as URLPattern }
export { URLConstructor as URL }
export { URLSearchParamsConstructor as URLSearchParams }
