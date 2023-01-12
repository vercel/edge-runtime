import { readFile } from 'fs/promises'
import { join } from 'path'
import { Project, ScriptKind, SourceFile, SyntaxKind } from 'ts-morph'
import { findDependencies } from '../src'
import { buildProject } from '../src/utils/project'

const fixtureFolder = join(__dirname, 'fixtures')

describe.each([
  { title: 'for JavaScript' },
  { title: 'for TypeScript', isTS: true },
])('findDependencies() $title', ({ isTS }) => {
  let project: Project
  let file: SourceFile

  beforeEach(() => {
    project = buildProject()
    file = project.createSourceFile(`test.${isTS ? 'ts' : 'js'}`)
  })

  it('returns globals variable used as variables', () => {
    file.replaceWithText(`
      __filename
      process.env['TEST']
    `)
    expect(findDependencies(file.getFilePath(), project)).toEqual({
      globals: ['__filename', 'process'],
    })
  })

  it('returns globals variable with typeof', () => {
    file.replaceWithText(`
      if (typeof process !== 'undefined') {
        console.log('in node')
      }
    `)
    expect(findDependencies(file.getFilePath(), project)).toEqual({
      globals: ['process'],
    })
  })

  it('returns globals variables used as parameters', () => {
    file.replaceWithText(`
      console.log('in node', __dirname)
    `)
    expect(findDependencies(file.getFilePath(), project)).toEqual({
      globals: ['__dirname'],
    })
  })

  it('returns globals variables in instructions', () => {
    file.replaceWithText(`
      while(__dirname) {
        for (const key in exports) {}
      }
    `)
    expect(findDependencies(file.getFilePath(), project)).toEqual({
      globals: ['__dirname', 'exports'],
    })
  })

  it('returns globals used with static methods', () => {
    file.replaceWithText(`
      function foo() {
        return Response.redirect(Buffer.from('ok'))
      }
    `)
    expect(findDependencies(file.getFilePath(), project)).toEqual({
      globals: ['Buffer'],
    })
  })

  it('returns globals used with new operator', () => {
    file.replaceWithText(`new Buffer(['o', 'k'])`)
    expect(findDependencies(file.getFilePath(), project)).toEqual({
      globals: ['Buffer'],
    })
  })

  it('returns globals used as properties', () => {
    file.replaceWithText(`Buffer.poolSize`)
    expect(findDependencies(file.getFilePath(), project)).toEqual({
      globals: ['Buffer'],
    })
  })

  it('returns globals used as functions', () => {
    file.replaceWithText(`
      setImmediate(() => {
        $('.do-you[remember="the time"]')
      })
    `)
    expect(findDependencies(file.getFilePath(), project)).toEqual({
      globals: ['setImmediate', '$'],
    })
  })

  it('ignores known DOM globals', () => {
    file.replaceWithText(`
      console.log(JSON.stringify({ msg: btoa('hi') }))
      const controller = new AbortController()
    `)
    expect(findDependencies(file.getFilePath(), project)).toEqual({
      globals: [], // no console, JSON, btoa, AbortController
    })
  })

  it('dedupes identified globals', () => {
    file.replaceWithText(`
      function foo() {
        const buffer1 = Buffer.from('ok'+ Buffer.poolSize)
        const buffer2 = Buffer.alloc(5, 0)
        if (buffer1.equal(buffer2)) {
          console.log('impossible!')
        }
      }
    `)
    expect(findDependencies(file.getFilePath(), project)).toEqual({
      globals: ['Buffer'],
    })
  })

  it('find globals from 3rd party code', async () => {
    const file = project.addSourceFileAtPath(
      join(fixtureFolder, 'with-axios.out.js')
    )
    expect(findDependencies(file.getFilePath(), project)).toEqual({
      globals: [
        'navigator',
        'window',
        'document',
        'Buffer',
        'XMLHttpRequest',
        'process',
      ],
    })
  })
})
