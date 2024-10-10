export const atob = (enc) => Buffer.from(enc, 'base64').toString('binary')
export const btoa = (str) =>
  Buffer.from(String(str), 'binary').toString('base64')
