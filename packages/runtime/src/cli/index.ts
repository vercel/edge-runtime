#!/usr/bin/env node

import { EdgeRuntime } from '../edge-runtime'
import { promisify } from 'util'
import { readFileSync } from 'fs'
import { runServer, type EdgeRuntimeServer } from '../server'
import childProcess from 'child_process'
import exitHook from 'exit-hook'
import mri from 'mri'
import path from 'path'

const { _: input, ...flags } = mri(process.argv.slice(2), {
  alias: {
    e: 'eval',
    h: 'host',
    l: 'listen',
    p: 'port',
  },
  default: {
    cwd: process.cwd(),
    eval: false,
    help: false,
    host: '127.0.0.1',
    listen: false,
    port: 3000,
    repl: false,
  },
})

async function main() {
  if (flags.help) {
    const { help } = await import('./help')
    console.log(help())
    return
  }

  if (flags.eval) {
    const { inlineEval } = await import('./eval')
    console.log(await inlineEval(input[0]))
    return
  }

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

  const logger = await import('./logger').then(({ createLogger }) =>
    createLogger()
  )

  logger.debug(
    `v${String(require('../../package.json').version)} at Node.js ${
      process.version
    }`
  )

  /**
   * Start a server with the script provided in the file path.
   */
  let server: undefined | EdgeRuntimeServer
  let port = flags.port
  while (server === undefined) {
    try {
      server = await runServer({
        host: flags.host,
        logger: logger,
        port,
        runtime,
      })
    } catch (error: any) {
      if (error?.code === 'EADDRINUSE') {
        logger.warn(`Port \`${port}\` already in use`)
        ++port
      } else throw error
    }
  }

  exitHook(() => server?.close())
  logger(`Waiting incoming requests at ${logger.quotes(server.url)}`)
}

main().catch((error: any) => {
  if (!(error instanceof Error)) error = new Error(error)
  process.exit(1)
})
