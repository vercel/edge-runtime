import { getDefaultExport } from '../../src/utils/exports'
import { initTestProjectAndFiles } from '../test-utils'

const { jsFile, tsFile } = initTestProjectAndFiles()

describe.each([
  { title: 'for JavaScript', file: jsFile },
  { title: 'for TypeScript', file: tsFile },
])('getDefaultExport() $title', ({ file }) => {
  it('handles no default export', () => {
    expect(getDefaultExport(file)).toBeUndefined()
  })

  it('finds exported declaration', () => {
    file.replaceWithText(`export default let foo = 'bar`)
    expect(getDefaultExport(file)?.getKindName()).toBe('ExportAssignment')
  })

  it('finds exported definition', () => {
    file.replaceWithText(`export default function foo() {}`)
    expect(getDefaultExport(file)?.getKindName()).toBe('FunctionDeclaration')
  })
})
