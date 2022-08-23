import { serialize } from 'cookie'
import { parseCookieString } from './serialize'
import { cached } from './cached'

export class RequestCookies {
  private readonly headers: Headers

  constructor(request: Request) {
    this.headers = request.headers
  }

  clear(): void {
    this.delete([...this.keys()])
  }

  get size(): number {
    return this.parsed().size
  }

  entries(): IterableIterator<[string, string]> {
    return this.parsed().entries()
  }

  keys(): IterableIterator<string> {
    return this.parsed().keys()
  }

  values(): IterableIterator<string> {
    return this.parsed().values()
  }

  get [Symbol.toStringTag](): string {
    return 'RequestCookies'
  }

  [Symbol.iterator]() {
    return this.parsed()[Symbol.iterator]()
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

  delete(names: string[]): boolean[]
  delete(name: string): boolean
  delete(names: string | string[]): boolean | boolean[] {
    const map = this.parsed()
    const result = !Array.isArray(names)
      ? map.delete(names)
      : names.map((name) => map.delete(name))
    this.headers.set(
      'cookie',
      [...map].map(([key, value]) => serialize(key, value)).join('; ')
    )
    return result
  }
}
