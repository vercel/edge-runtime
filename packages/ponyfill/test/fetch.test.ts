import { fetch } from '..'

test('fetches an origin', async () => {
  const response = await fetch('https://example.vercel.sh')
  const text = await response.text()
  expect(text).toContain('Example Domain')
})
