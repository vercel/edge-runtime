import { dirname, resolve } from 'path'
import { Project, SourceFile, ts } from 'ts-morph'
import { buildProject } from './utils/project'

/**
 * Find the list of globals used by source files in the provided project.
 * Analyzed source files can be filtered by provided a list of glob patterns (default to all TypeScript and JavaScript files, excluding type definitions)
 */
export function findGlobals(
  sourcePath: string,
  project: Project = buildProject()
): string[] {
  const globals = new Set<string>()
  const sourceFile = project.addSourceFileAtPath(sourcePath)
  addFileGlobals(sourceFile, globals)
  return [...globals]
}

function addFileGlobals(sourceFile: SourceFile, globals: Set<string>) {
  const program = sourceFile.getProject().getProgram().compilerObject
  const diagnostics = program.getSemanticDiagnostics(sourceFile.compilerNode)
  // see all diagnostics messages: https://github.com/microsoft/TypeScript/blob/main/src/compiler/diagnosticMessages.json
  // for example: { code: 2304, messageText: "Cannot find name 'process'." }
  for (const { code, messageText } of diagnostics) {
    // only some messages will relate with identifiers that could not be found: filter them by code,
    if (
      code === 2304 ||
      code === 2311 ||
      code === 2552 ||
      (code >= 2562 && code <= 2563) ||
      (code >= 2580 && code <= 2584) ||
      (code >= 2591 && code <= 2593)
    ) {
      const match = ts
        .flattenDiagnosticMessageText(messageText, '\n')
        .match(/^Cannot find name '([^']+)'\./)
      if (match) {
        globals.add(match[1])
      }
    }
  }
}
