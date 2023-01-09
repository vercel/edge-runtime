import { getReturnType } from '../../src/utils/functions'
import { initTestProjectAndFiles } from '../test-utils'

const { jsFile, tsFile } = initTestProjectAndFiles()

describe.each([
  { title: 'for JavaScript', file: jsFile },
  { title: 'for TypeScript', file: tsFile, isTS: true },
])('getReturnType() $title', ({ file, isTS }) => {
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

  it('handles cyclic references', () => {
    file.replaceWithText(`
      const exported = () => { 
        const x = {}
        x.next = x
        return x.next;
      }`)
    const fct = file
      .getVariableStatementOrThrow('exported')
      .getDeclarations()[0]
      .getChildAtIndex(2)
    expect(getReturnType(fct)?.getText()).toBe(isTS ? 'any' : '{ next: any; }')
  })

  if (isTS) {
    it('handles invalid cyclic type', () => {
      file.replaceWithText(`
        type A = A
        function foo(): A {}`)
      const fct = file.getFunctionOrThrow('foo')
      expect(getReturnType(fct)?.getText()).toBe('any')
    })
  }
})
