import { splitCookiesString } from '../src/serialize'

test('.splitCookiesString', async () => {
  const cookieString =
    'cookie1=value1, cookie2=value2; Max-Age=1000, cookie3=value3; Domain=<domain-value>; Secure'
  expect(splitCookiesString(cookieString)).toEqual([
    'cookie1=value1',
    'cookie2=value2; Max-Age=1000',
    'cookie3=value3; Domain=<domain-value>; Secure',
  ])
})
