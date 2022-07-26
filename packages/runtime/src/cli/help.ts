import { dim, white } from 'picocolors'
interface HelpOptions extends Record<string, string> {}

const flags: HelpOptions = {
  eval: 'Evaluate an input script',
  help: 'Display this message.',
  listen: 'Run as HTTP server.',
  port: 'Specify a port to use.',
  repl: 'Start an interactive session.',
}

export const help = () => `
  edge-runtime ${dim('[<flags>] [input]')}

  ${dim('Flags:')}

${getSectionSummary(flags)}
`

function getPadLength(options: HelpOptions) {
  const lengths = Object.keys(options).map((key) => key.length)
  return Math.max.apply(null, lengths) + 1
}

function getSectionSummary(options: HelpOptions) {
  const summaryPadLength = getPadLength(options)

  const summary = Object.entries(options)
    .map(
      ([key, description]) =>
        `    --${key.padEnd(summaryPadLength)} ${dim(description)}`
    )
    .join('\n')

  return `${summary}`
}
