import {
  stringifyCookie,
  parseCookie,
  parseSetCookie,
  splitCookiesString,
} from '../src'

test('.stringifyCookie is exported', async () => {
  expect(typeof stringifyCookie).toBe('function')
})

test('.parseCookie is exported', async () => {
  expect(typeof parseCookie).toBe('function')
})

test('.parseSetCookie is exported', async () => {
  expect(typeof parseSetCookie).toBe('function')
})

test('.splitCookiesString is exported', async () => {
  expect(typeof splitCookiesString).toBe('function')
})
