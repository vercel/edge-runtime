import type { CookieSerializeOptions } from 'cookie'

export interface Options extends CookieSerializeOptions {}

export function serialize(
  name: string,
  value: string,
  options: Options
): string {
  const { expires, maxAge, domain, path, secure, httpOnly, sameSite } = options
  const attrs = [
    path ? `Path=${path}` : '',
    expires ? `Expires=${expires.toUTCString()}` : '',
    maxAge ? `Max-Age=${maxAge}` : '',
    domain ? `Domain=${domain}` : '',
    secure ? 'Secure' : '',
    httpOnly ? 'HttpOnly' : '',
    sameSite ? `SameSite=${sameSite}` : '',
  ].filter(Boolean)

  return `${name}=${encodeURIComponent(value)}; ${attrs.join('; ')}`
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
export function parseSetCookieString(
  setCookie: string
): undefined | { name: string; value: string; attributes: Options } {
  if (!setCookie) {
    return undefined
  }

  const [[name, value], ...attributes] = parseCookieString(setCookie)
  const { domain, expires, httponly, maxage, path, samesite, secure } =
    Object.fromEntries(
      attributes.map(([key, value]) => [key.toLowerCase(), value])
    )
  const options: Options = {
    domain,
    ...(expires && { expires: new Date(expires) }),
    ...(httponly && { httpOnly: true }),
    ...(typeof maxage === 'string' && { maxAge: Number(maxage) }),
    path,
    ...(samesite && { sameSite: parseSameSite(samesite) }),
    ...(secure && { secure: true }),
  }

  return {
    name,
    value: decodeURIComponent(value),
    attributes: compact(options),
  }
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

const SAME_SITE: Options['sameSite'][] = ['strict', 'lax', 'none']
function parseSameSite(string: string): Options['sameSite'] {
  return SAME_SITE.includes(string as any)
    ? (string as Options['sameSite'])
    : undefined
}
