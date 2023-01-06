import { Project } from 'ts-morph'
// @ts-ignore will be resolved by tsup & jest
import typeDefinitionContent from './type-definition.txt'

/**
 * Builds a TS-morph project that allows JS code and loads our custom Response + Promise types
 */
export function buildProject() {
  const project = new Project({
    compilerOptions: {
      allowJs: true,
    },
  })
  project.createSourceFile('node_modules/index.d.ts', typeDefinitionContent)
  project.addDirectoryAtPathIfExists('.')
  return project
}
