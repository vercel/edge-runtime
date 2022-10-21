import type { CookieSerializeOptions } from 'cookie'

/**
 * {@link https://wicg.github.io/cookie-store/#dictdef-cookielistitem CookieListItem} as specified by W3C.
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
 * Extends {@link CookieListItem} with the `httpOnly`, `maxAge` and `priority` properties.
 */
export type Cookie = CookieListItem &
  Pick<CookieSerializeOptions, 'httpOnly' | 'maxAge' | 'priority'>

export function serialize(cookie: Cookie): string {
  const attrs = [
    cookie.path ? `Path=${cookie.path}` : '',
    cookie.expires ? `Expires=${cookie.expires.toUTCString()}` : '',
    cookie.maxAge ? `Max-Age=${cookie.maxAge}` : '',
    cookie.domain ? `Domain=${cookie.domain}` : '',
    cookie.secure ? 'Secure' : '',
    cookie.httpOnly ? 'HttpOnly' : '',
    cookie.sameSite ? `SameSite=${cookie.sameSite}` : '',
  ].filter(Boolean)

  return `${cookie.name}=${encodeURIComponent(
    cookie.value ?? ''
  )}; ${attrs.join('; ')}`
}

/**
 * Parse a `Cookie` header value
 */
export function parseCookieString(cookie: string): Map<string, string> {
  const map = new Map<string, string>()

  for (const pair of cookie.split(/; */)) {
    if (!pair) continue
    const [key, value] = pair.split('=', 2)
    map.set(key, decodeURIComponent(value ?? 'true'))
  }

  return map
}

/**
 * Parse a `Set-Cookie` header value
 */
export function parseSetCookieString(setCookie: string): undefined | Cookie {
  if (!setCookie) {
    return undefined
  }

  const [[name, value], ...attributes] = parseCookieString(setCookie)
  const { domain, expires, httponly, maxage, path, samesite, secure } =
    Object.fromEntries(
      attributes.map(([key, value]) => [key.toLowerCase(), value])
    )
  const cookie: Cookie = {
    name,
    value: decodeURIComponent(value),
    domain,
    ...(expires && { expires: new Date(expires) }),
    ...(httponly && { httpOnly: true }),
    ...(typeof maxage === 'string' && { maxAge: Number(maxage) }),
    path,
    ...(samesite && { sameSite: parseSameSite(samesite) }),
    ...(secure && { secure: true }),
  }

  return compact(cookie)
}

function compact<T>(t: T): T {
  const newT = {} as Partial<T>
  for (const key in t) {
    if (t[key]) {
      newT[key] = t[key]
    }
  }
  return newT as T
}

const SAME_SITE: Cookie['sameSite'][] = ['strict', 'lax', 'none']
function parseSameSite(string: string): Cookie['sameSite'] {
  return SAME_SITE.includes(string as any)
    ? (string as Cookie['sameSite'])
    : undefined
}
