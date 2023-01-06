import { getReturnType } from '../../src/utils/functions'
import { initTestProjectAndFiles } from '../test-utils'

const { jsFile, tsFile } = initTestProjectAndFiles()

describe.each([
  { title: 'for JavaScript', file: jsFile },
  { title: 'for TypeScript', file: tsFile },
])('getReturnType() $title', ({ file }) => {
  it('finds DOM types', () => {
    file.replaceWithText(`function foo() { return new Response('ok') }`)
    const fct = file.getFunctionOrThrow('foo')
    expect(getReturnType(fct)?.getText()).toBe('Response')
  })

  it('finds promises', () => {
    file.replaceWithText(
      `function foo() { return Promise.resolve(new Response('ok')) }`
    )
    const fct = file.getFunctionOrThrow('foo')
    expect(getReturnType(fct)?.getText()).toBe('Promise<Response>')
  })

  it('finds literals', () => {
    file.replaceWithText(`function foo() { return 10 }`)
    const fct = file.getFunctionOrThrow('foo')
    expect(getReturnType(fct)?.getText()).toBe('number')
  })

  it('handles no return type', () => {
    file.replaceWithText(`function foo() {}`)
    const fct = file.getFunctionOrThrow('foo')
    expect(getReturnType(fct)?.getText()).toBe('void')
  })

  it('handles export assignment', () => {
    file.replaceWithText(`function foo() { return 10 }; export default foo`)
    const fct = file.getDefaultExportSymbol()?.getDeclarations()[0]
    expect(getReturnType(fct)?.getText()).toBe('number')
  })
})
