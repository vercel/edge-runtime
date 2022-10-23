import type { CookieSerializeOptions } from 'cookie'

/**
 * {@link https://wicg.github.io/cookie-store/#dictdef-cookielistitem CookieListItem}
 * as specified by W3C.
 */
export interface CookieListItem
  extends Pick<
    CookieSerializeOptions,
    'domain' | 'path' | 'expires' | 'secure' | 'sameSite'
  > {
  /** A string with the name of a cookie. */
  name: string
  /** A string containing the value of the cookie. */
  value: string
}

/**
 * Superset of {@link CookieListItem} extending it with
 * the `httpOnly`, `maxAge` and `priority` properties.
 */
export type ResponseCookie = CookieListItem &
  Pick<CookieSerializeOptions, 'httpOnly' | 'maxAge' | 'priority'>

/**
 * Subset of {@link CookieListItem}, only containing `name` and `value`
 * since other cookie attributes aren't be availeble on a `Request`.
 */
export type RequestCookie = Pick<CookieListItem, 'name' | 'value'>
