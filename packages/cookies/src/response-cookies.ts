import { cached } from './cached'
import { type Options, parseSetCookieString, serialize } from './serialize'

type ParsedCookie = { value: string; options: Options }
export type CookieBag = Map<string, ParsedCookie>

export class ResponseCookies {
  private readonly headers: Headers

  constructor(response: Response) {
    this.headers = response.headers
  }

  private cache = cached((_key: string | null) => {
    // @ts-ignore
    const headers = this.headers.getAll('set-cookie')
    const map = new Map<string, ParsedCookie>()

    for (const header of headers) {
      const parsed = parseSetCookieString(header)
      if (parsed) {
        map.set(parsed.name, {
          value: parsed.value,
          options: parsed?.attributes,
        })
      }
    }

    return map
  })

  private parsed() {
    const allCookies = this.headers.get('set-cookie')
    return this.cache(allCookies)
  }

  set(key: string, value: string, options?: Options): this {
    const map = this.parsed()
    map.set(key, { value, options: normalizeCookieOptions(options || {}) })
    replace(map, this.headers)

    return this
  }

  delete(key: string): this {
    return this.set(key, '', { expires: new Date(0) })
  }

  get(key: string): string | undefined {
    return this.getWithOptions(key)?.value
  }

  getWithOptions(key: string): {
    value: string | undefined
    options: Options
  } {
    const element = this.parsed().get(key)
    return { value: element?.value, options: element?.options ?? {} }
  }

  [Symbol.for('edge-runtime.inspect.custom')]() {
    return `ResponseCookies ${JSON.stringify(
      Object.fromEntries(this.parsed())
    )}`
  }
}

function replace(bag: CookieBag, headers: Headers) {
  headers.delete('set-cookie')
  for (const [key, { value, options }] of bag) {
    const serialized = serialize(key, value, options)
    headers.append('set-cookie', serialized)
  }
}

const normalizeCookieOptions = (options: Options) => {
  options = Object.assign({}, options)

  if (options.maxAge) {
    options.expires = new Date(Date.now() + options.maxAge * 1000)
  }

  if (options.path === null || options.path === undefined) {
    options.path = '/'
  }

  return options
}
