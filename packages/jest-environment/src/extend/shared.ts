import { JSONBodyParams } from './types'

export function assertRequestOrResponse(
  actual: unknown
): asserts actual is Request | Response {
  if (actual instanceof Request || actual instanceof Response) return
  throw new Error('Expected a Request or Response instance')
}

expect.extend({
  async toHaveJSONBody(actual, ...args: JSONBodyParams) {
    assertRequestOrResponse(actual)
    const [body] = args
    const contentType = actual.headers.get('Content-Type')

    if (!contentType?.includes('application/json')) {
      const type = actual instanceof Request ? 'request' : 'response'
      return {
        message: () =>
          [
            `${this.utils.matcherHint('toHaveJSONBody')}\n`,
            `Expected ${type} to have "Content-Type": ${this.utils.printExpected(
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
    assertRequestOrResponse(actual)
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
