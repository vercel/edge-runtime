import { webcrypto } from 'node:crypto'

const { Crypto, CryptoKey } = webcrypto

function SubtleCrypto() {
  if (!(this instanceof SubtleCrypto)) return new SubtleCrypto()
  throw TypeError('Illegal constructor')
}

export const crypto = new Crypto()

export { Crypto }
export { CryptoKey }
export { SubtleCrypto }
