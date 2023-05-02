export const atob = (enc) => Buffer.from(enc, 'base64').toString('binary')
export const btoa = (str) => Buffer.from(str, 'binary').toString('base64')

const TE = TextEncoder
const TD = TextDecoder

export { TE as TextEncoder, TD as TextDecoder }
