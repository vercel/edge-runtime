import { buildProject } from '../src/utils/project'

export function initTestProjectAndFiles() {
  const project = buildProject()
  const jsFile = project.createSourceFile('test.js')
  const tsFile = project.createSourceFile('test.ts')
  return { project, jsFile, tsFile }
}
