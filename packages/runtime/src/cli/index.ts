#!/usr/bin/env node

import { createLogger } from './logger'
import { EdgeRuntime } from '../edge-runtime'
import { promisify } from 'util'
import { readFileSync } from 'fs'
import { runServer } from '../server'
import childProcess from 'child_process'
import exitHook from 'exit-hook'
import mri from 'mri'
import path from 'path'

const { _: input, ...flags } = mri(process.argv.slice(2), {
  default: {
    cwd: process.cwd(),
    listen: false,
    port: 3000,
    repl: false,
  },
})

async function main() {
  const logger = createLogger()

  /**
   * If there is no script path to run a server, the CLI will start a REPL.
   */
  const [scriptPath] = input

  if (!scriptPath) {
    const replPath = path.resolve(__dirname, 'repl.js')
    return promisify(childProcess.spawn).call(null, 'node', [replPath], {
      stdio: 'inherit',
    })
  }

  const initialCode = readFileSync(
    path.resolve(process.cwd(), scriptPath),
    'utf-8'
  )
  const runtime = new EdgeRuntime({ initialCode })
  if (!flags.listen) return runtime.evaluate('')

  logger.debug(
    `v${String(require('../../package.json').version)} at Node.js ${
      process.version
    }`
  )

  /**
   * Start a server with the script provided in the file path.
   */
  const server = await runServer({
    logger: logger,
    port: flags.port,
    runtime,
  })

  exitHook(() => server.close())
  logger(`Waiting incoming requests at ${logger.quotes(server.url)}`)
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
