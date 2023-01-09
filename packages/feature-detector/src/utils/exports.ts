import { Node, SourceFile } from 'ts-morph'

/**
 * Get the default export of a modules, if any.
 * Supported:
 * - export definition: `export default function foo() {}`
 * - exported declaration: `const foo = 'bar'; export default foo`
 */
export function getDefaultExport(sourceFile: SourceFile): Node | undefined {
  const defaultExport = sourceFile.getDefaultExportSymbol()
  return (
    defaultExport?.getValueDeclaration() ??
    defaultExport?.getDeclarations()?.[0] // when exporting a variable: `export default handler`
  )
}
