/**
 * Implement polyfills for the Crypto Module. Since we support down to Node 12
 * we use a UUID package to support generating random values. We also must
 * transform web/stream into the ponyfill require when bundling in case any
 * dependency uses Node recent web streams.
 */
import { Crypto as WebCrypto, CryptoKey } from '@peculiar/webcrypto'
import { v4 as uuid } from 'uuid'

class Crypto extends WebCrypto {
  #randomUUID = uuid
}

function SubtleCrypto() {
  if (!(this instanceof SubtleCrypto)) return new SubtleCrypto()
  throw TypeError('Illegal constructor')
}

export const crypto = new Crypto()

export { Crypto }
export { CryptoKey }
export { SubtleCrypto }
