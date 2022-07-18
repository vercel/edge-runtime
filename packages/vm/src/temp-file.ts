import { crypto } from '@edge-runtime/primitives/crypto'
import path from 'path'
import fs from 'fs'
import os from 'os'

/**
 * Creates a temporary file with the provided content and returns the
 * generated path and a function to remove the file once it has
 * been used. This allows to hide details.
 */
export function tempFile(code: string) {
  const filepath = path.join(os.tmpdir(), crypto.randomUUID())
  fs.writeFileSync(filepath, code)
  return {
    path: filepath,
    remove: () => fs.unlinkSync(filepath),
  }
}
