import type { URLPattern } from 'urlpattern-polyfill/dist/types'

declare const _URL: typeof URL
declare const _URLSearchParams: typeof URLSearchParams
declare class _URLPattern extends URLPattern {}

export {
  _URL as URL,
  _URLPattern as URLPattern,
  _URLSearchParams as URLSearchParams,
}
