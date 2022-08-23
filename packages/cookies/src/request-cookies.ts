import { serialize } from 'cookie'
import { parseCookieString } from './serialize'
import { cached } from './cached'

export class RequestCookies {
  private readonly headers: Headers

  constructor(request: Request) {
    this.headers = request.headers
  }

  *[Symbol.iterator]() {
    for (const [key, value] of this.parsed()) {
      yield [key, value]
    }
  }

  private cache = cached((header: string | null) => {
    const parsed = header ? parseCookieString(header) : new Map()
    return parsed
  })

  private parsed(): Map<string, string> {
    const header = this.headers.get('cookie')
    return this.cache(header)
  }

  get(name: string) {
    return this.parsed().get(name)
  }

  has(name: string) {
    return this.parsed().has(name)
  }

  set(name: string, value: string): this {
    const map = this.parsed()
    map.set(name, value)
    this.headers.set(
      'cookie',
      [...map].map(([key, value]) => serialize(key, value)).join('; ')
    )
    return this
  }

  delete(name: string): this {
    const map = this.parsed()
    map.delete(name)
    this.headers.set(
      'cookie',
      [...map].map(([key, value]) => serialize(key, value)).join('; ')
    )
    return this
  }
}
