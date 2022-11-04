import type { JSONBodyParams, StatusParams } from './types'
export * from './types'

// Utils

function assertRequest(actual: unknown): asserts actual is Request {
  if (actual instanceof Request) return
  throw new Error('Expected a Request instance')
}

// Matchers

expect.extend({
  async toHaveJSONBody(actual, ...args: JSONBodyParams) {
    assertRequest(actual)
    const [body] = args
    const contentType = actual.headers.get('Content-Type')

    if (!contentType?.includes('application/json')) {
      return {
        message: () =>
          [
            `${this.utils.matcherHint('toHaveJSONBody')}\n`,
            `Expected request to have "Content-Type": ${this.utils.printExpected(
              'application/json'
            )}`,
            `Received: ${this.utils.printReceived(contentType)}`,
          ].join('\n'),
        pass: false,
      }
    }
    const json = await actual.clone().json()
    const pass = this.equals(json, body)
    if (pass) {
      return {
        message: () => `expected ${json} not to be ${body}`,
        pass: true,
      }
    }
    return {
      message: () =>
        `expected JSON body '${JSON.stringify(json)}' to be '${JSON.stringify(
          body
        )}'`,
      pass: false,
    }
  },
  async toHaveTextBody(actual, body: string) {
    assertRequest(actual)
    const text = await actual.clone().text()
    const pass = this.equals(text, body)
    if (pass) {
      return {
        message: () => `expected ${text} not to be ${body}`,
        pass: true,
      }
    }
    return {
      message: () => `expected text body '${text}' to be '${body}'`,
      pass: false,
    }
  },
})
