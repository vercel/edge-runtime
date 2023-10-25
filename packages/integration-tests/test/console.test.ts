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
  expect(console).toHaveProperty(key, expect.any(Function))
  const fn = console[key as keyof typeof console]
  expect(typeof fn.bind(console)).toBe('function')
})
