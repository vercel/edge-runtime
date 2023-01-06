import { extractFromPromise, isSubClassOf } from '../../src/utils/types'
import { initTestProjectAndFiles } from '../test-utils'

const { jsFile, tsFile } = initTestProjectAndFiles()

describe.each([
  { title: 'for JavaScript', file: jsFile },
  { title: 'for TypeScript', file: tsFile },
])('isSubClassOf() $title', ({ file }) => {
  it('detects the same class', () => {
    file.replaceWithText(`class A { foo: string; }`)
    const type = file.getClassOrThrow('A').getType()
    expect(isSubClassOf(type, 'A')).toBe(true)
  })

  it('detects the same class', () => {
    file.replaceWithText(`
      class A { foo: string; }
      class B extends A {
        bar: number;
      }
    `)
    const type = file.getClassOrThrow('B').getType()
    expect(isSubClassOf(type, 'A')).toBe(true)
  })

  it('detects different class', () => {
    file.replaceWithText(`
      class A { foo: string; }
      class B { bar: number; }
    `)
    const type = file.getClassOrThrow('A').getType()
    expect(isSubClassOf(type, 'B')).toBe(false)
  })

  it('handles unknown class', () => {
    expect(isSubClassOf(undefined, 'B')).toBe(false)
  })

  it('handles unknown expected class', () => {
    file.replaceWithText(`class A { foo: string }`)
    const type = file.getClassOrThrow('A').getType()
    expect(isSubClassOf(type, 'unknown')).toBe(false)
  })
})

describe.each([
  { title: 'for JavaScript', file: jsFile },
  { title: 'for TypeScript', file: tsFile, isTS: true },
])('extractFromPromise() $title', ({ file, isTS }) => {
  it('returns non-promise type', () => {
    file.replaceWithText(`const value = new Response('ok')`)
    const type = file.getVariableDeclarationOrThrow('value').getType()
    expect(type?.getText()).toEqual('Response')
    expect(extractFromPromise(type)?.getText()).toEqual('Response')
  })

  it('extract type from promise', () => {
    file.replaceWithText(`const value = Promise.resolve(new Response('ok'))`)
    const type = file.getVariableDeclarationOrThrow('value').getType()
    expect(type?.getText()).toEqual('Promise<Response>')
    expect(extractFromPromise(type)?.getText()).toEqual('Response')
  })

  it('extract type from async code', () => {
    file.replaceWithText(`const value = (async () => new Response('ok'))()`)
    const type = file.getVariableDeclarationOrThrow('value').getType()
    expect(type?.getText()).toEqual('Promise<Response>')
    expect(extractFromPromise(type)?.getText()).toEqual('Response')
  })

  it('extract type from built promise', () => {
    file.replaceWithText(
      `const value = new Promise${
        isTS ? '<Response>' : ''
      }(resolve => resolve(new Response('ok')))`
    )
    const type = file.getVariableDeclarationOrThrow('value').getType()
    // By default, promises are typed as Promise<unknon>.
    // Typescript code can explicitely specify a type, but Javascript code can not
    expect(type?.getText()).toEqual(isTS ? 'Promise<Response>' : 'Promise<any>')
    expect(extractFromPromise(type)?.getText()).toEqual(
      isTS ? 'Response' : 'any'
    )
  })
})
