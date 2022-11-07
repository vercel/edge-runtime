import type { StatusParams } from './types'

function assertResponse(actual: unknown): asserts actual is Response {
  if (actual instanceof Response) return
  throw new Error('Expected a Response instance')
}

const HTTP_STATUS_CODE_RANGES = {
  '1': 'Informational',
  '2': 'Successful',
  '3': 'Redirection',
  '4': 'Client Error',
  '5': 'Server Error',
}

type HttpStatusCodeRange = keyof typeof HTTP_STATUS_CODE_RANGES

expect.extend({
  toHaveStatus(actual, ...args: StatusParams) {
    assertResponse(actual)
    const [status] = args
    if (typeof status === 'string') {
      const httpStatusCodeRange =
        actual.status.toString()[0] as HttpStatusCodeRange
      const matchedRange = HTTP_STATUS_CODE_RANGES[httpStatusCodeRange]
      const statusRange = Object.keys(httpStatusCodeRange).find(
        (k) => httpStatusCodeRange[k as HttpStatusCodeRange] === status
      )

      const pass = matchedRange === status
      return {
        message: () =>
          `expected ${actual.status} (${matchedRange})${
            pass ? ' not' : ''
          } to be in status range (${statusRange}xx)`,
        pass,
      }
    }
    const pass = actual.status === status
    if (pass) {
      return {
        message: () => `expected ${actual.status} not to be ${status}`,
        pass,
      }
    }
    return {
      message: () => `expected ${actual.status} to be ${status}`,
      pass,
    }
  },
})
