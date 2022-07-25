interface HelpOptions extends Record<string, string> {}

const helpSummary = 'Usage: edge-runtime [input] [<flags>]\n'

const flags: HelpOptions = {
  help: 'Display help message for flags.',
  listen: 'Interact with edge-runtime as an HTTP server.',
  port: 'Specify a port to use.',
  repl: 'Start an interactive session.',
}

export function help() {
  const flagsSummary = getSectionSummary('Flags', flags)
  const message = [helpSummary, flagsSummary].join('\n')
  console.log(message)
}

function getPadLength(options: HelpOptions) {
  const lengths = Object.keys(options).map((key) => key.length)
  return Math.max.apply(null, lengths)
}

function getSectionSummary(title: string, options: HelpOptions) {
  const summaryPadLength = getPadLength(options)

  const summary = Object.entries(options)
    .map(([key, value]) => `  --${key.padEnd(summaryPadLength)} ${value}`)
    .join('\n')

  return `${title}:\n${summary}\n`
}
