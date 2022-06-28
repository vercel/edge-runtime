/**
 * Implement polyfills for the Crypto Module. Since we support down to Node 12
 * we use a UUID package to support generating random values. We also must
 * transform web/stream into the ponyfill require when bundling in case any
 * dependency uses Node recent web streams.
 */
const { Crypto: WebCrypto, CryptoKey } = require('@peculiar/webcrypto')
const { v4: uuid } = require('uuid')

class Crypto extends WebCrypto {
  #randomUUID = uuid
}

function SubtleCrypto() {
  if (!(this instanceof SubtleCrypto)) return new SubtleCrypto()
  throw TypeError('Illegal constructor')
}

function SubtleCryptoToString() {
  return 'function SubtleCrypto() { [native code] }'
}

Object.defineProperty(SubtleCryptoToString, 'name', {
  configurable: true,
  enumerable: false,
  value: 'toString() { [native code] }',
  writable: true,
})

Object.defineProperty(SubtleCrypto, 'toString', {
  configurable: true,
  enumerable: false,
  value: SubtleCryptoToString,
  writable: true,
})

module.exports.Crypto = Crypto
module.exports.CryptoKey = CryptoKey
module.exports.SubtleCrypto = SubtleCrypto
