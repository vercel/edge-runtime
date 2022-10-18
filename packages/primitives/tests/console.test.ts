import { console as konsole } from '../console'

it.each([
  { method: 'assert' },
  { method: 'count' },
  { method: 'debug' },
  { method: 'dir' },
  { method: 'error' },
  { method: 'info' },
  { method: 'time' },
  { method: 'timeEnd' },
  { method: 'timeLog' },
  { method: 'trace' },
  { method: 'warn' },
])('$method', ({ method }) => {
  const key = method.toString()
  expect(konsole).toHaveProperty(key, expect.any(Function))
  const fn = konsole[key as keyof typeof konsole]
  expect(typeof fn.bind(console)).toBe('function')
})
