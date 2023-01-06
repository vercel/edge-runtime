// Requires node@18
// assumes being ran in packages/feature-detector

import { writeFile } from 'fs/promises'
import { join } from 'path'

const repositoryBaseUrl =
  'https://raw.githubusercontent.com/microsoft/TypeScript/main/lib'
const destinationFile = join('src', 'utils/type-definition.txt')

async function writeTypeDefinition() {
  const aggregatedContent = await fetchTypeDefinitions([
    'lib.es2022.d.ts',
    'lib.dom.d.ts',
  ])
  await writeFile(destinationFile, patchContent(aggregatedContent).join('\n'))
}

async function fetchTypeDefinitions(files: string[]) {
  const result = []
  for (const file of files) {
    result.push(...(await fetchTypeDefinition(file)))
  }
  return result
}

async function fetchTypeDefinition(file: string): Promise<string[]> {
  const content = await (await fetch(`${repositoryBaseUrl}/${file}`)).text()
  const result = []
  for (const line of content.split('\n')) {
    const reference = hasReference(line)
    if (reference) {
      result.push(...(await fetchTypeDefinition(`lib.${reference}.d.ts`)))
    } else {
      result.push(line)
    }
  }
  return result
}

function hasReference(line: string) {
  const match = line.match(/^\/\/\/\s*<reference\s+lib\s*=\s*"(.+)"\s*\/>/)
  return match ? match[1] : null
}

function patchContent(lines: string[]) {
  const result = []
  let inComment = false
  for (const line of lines) {
    if (inComment) {
      if (isMultiCommentEnd(line)) {
        inComment = false
      }
    } else {
      if (isMultiCommentStart(line)) {
        inComment = true
      } else if (!isSingleComment(line) && !isBlankLine(line)) {
        result.push(...applyPatch(line))
      }
    }
  }
  return result
}

function applyPatch(line: string) {
  if (line === 'declare var Response: {') {
    // adding missing json static method
    // https://fetch.spec.whatwg.org/#response-class
    return [line, '    json(data?: any, init?: ResponseInit): Response;']
  }
  return [line]
}

function isMultiCommentStart(line: string) {
  return /^\s*\/\*.*(?<!\*\/\s*)$/.test(line)
}

function isMultiCommentEnd(line: string) {
  return /\*\/\s*$/.test(line)
}

function isSingleComment(line: string) {
  return /^(?!\s*\/\/\/ <r)\s*\/\/|^\s*\/\*.+\*\//.test(line)
}

function isBlankLine(line: string) {
  return /^\s*$/.test(line)
}

writeTypeDefinition()
  .then((content) => {
    process.exit(0)
  })
  .catch((error) => {
    console.log('Errored', error)
    process.exit(1)
  })
