import { Project } from 'ts-morph'
// @ts-ignore will be resolved by tsup & jest
import typeDefinitionContent from './type-definition.txt'

/**
 * Builds a TS-morph project that allows JS code and loads our custom Response + Promise types
 */
export function buildProject() {
  const project = new Project({
    compilerOptions: {
      types: [], // does not load node.js types to only rely on types provided by Edge runtime
      allowJs: true,
      checkJs: true,
    },
  })
  project.createSourceFile('node_modules/index.d.ts', typeDefinitionContent)
  project.addDirectoryAtPath('.')
  return project
}
