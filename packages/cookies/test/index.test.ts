import { stringifyCookie, parseCookie, parseSetCookie } from '../src'

test('.stringifyCookie is exported', async () => {
  expect(typeof stringifyCookie).toBe('function')
})

test('.parseCookie is exported', async () => {
  expect(typeof parseCookie).toBe('function')
})

test('.parseSetCookie is exported', async () => {
  expect(typeof parseSetCookie).toBe('function')
})
