import { createFormat } from '@edge-runtime/format'
import type { Logger, LoggerOptions } from '../types'
import type { Formatter } from 'picocolors/types'
import pico from 'picocolors'

const isEnabled =
  process.env.EDGE_RUNTIME_LOGGING !== undefined
    ? Boolean(process.env.EDGE_RUNTIME_LOGGING)
    : true

export const format = createFormat()

/**
 * Creates basic logger with colors that can be used from the CLI and the
 * server logs.
 */
export function createLogger() {
  const logger = function (message: string, opts?: LoggerOptions) {
    print(message, opts)
  } as Logger

  logger.info = logger
  logger.error = (message, opts) => print(message, { color: 'red', ...opts })
  logger.debug = (message, opts) => print(message, { color: 'dim', ...opts })
  logger.quotes = (str: string) => `\`${str}\``
  return logger
}

function print(
  message: string,
  {
    color = 'white',
    withHeader = true,
    withBreakline = false,
  }: LoggerOptions = {}
) {
  if (!isEnabled) return
  const colorize = pico[color] as Formatter
  const header = withHeader ? `${colorize('ƒ')} ` : ''
  const separator = withBreakline ? '\n' : ''
  console.log(`${header}${separator}${colorize(message)}`)
}
