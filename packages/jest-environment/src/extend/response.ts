import type { StatusParams } from './types'

// Utils

function assertResponse(actual: unknown): asserts actual is Response {
  if (actual instanceof Response) return
  throw new Error('Expected a Response instance')
}

// Matchers

expect.extend({
  toHaveStatus(actual, ...args: StatusParams) {
    assertResponse(actual)
    const [status] = args
    if (typeof status === 'string') {
      const ranges = {
        '1': 'Informational',
        '2': 'Successful',
        '3': 'Redirection',
        '4': 'Client Error',
        '5': 'Server Error',
      }
      type RangeType = keyof typeof ranges
      const range = actual.status.toString()[0] as RangeType
      const matchedRange = ranges[range]

      const statusRange = Object.keys(ranges).find(
        (k) => ranges[k as RangeType] === status
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
