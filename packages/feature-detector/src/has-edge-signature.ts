import { Project } from 'ts-morph'
import { getDefaultExport } from './utils/exports'
import { getReturnType } from './utils/functions'
import { buildProject } from './utils/project'
import { extractFromPromise, isSubClassOf } from './utils/types'

/**
 * Returns true if the default export of the provided file is a function returning a web Response object.
 */
export function hasEdgeSignature(
  sourcePath: string,
  project: Project = buildProject()
) {
  const sourceFile = project.addSourceFileAtPath(sourcePath)
  const defaultExport = getDefaultExport(sourceFile)
  if (!defaultExport) {
    return false
  }
  const returnType = getReturnType(defaultExport)
  if (!returnType) {
    return false
  }
  return isSubClassOf(extractFromPromise(returnType), 'Response')
}
