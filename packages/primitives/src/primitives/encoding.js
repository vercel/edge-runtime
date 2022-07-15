export { TextEncoder, TextDecoder } from 'text-encoding'
export const atob = enc => Buffer.from(enc, 'base64').toString('binary')
export const btoa = str => Buffer.from(str, 'binary').toString('base64')
