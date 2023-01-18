import { join } from 'path'
import { Project, SourceFile } from 'ts-morph'
import { findGlobals } from '../src'
import { buildProject } from '../src/utils/project'

const fixtureFolder = join(__dirname, 'fixtures')

describe.each([
  { title: 'for JavaScript' },
  { title: 'for TypeScript', isTS: true },
])('findGlobals() $title', ({ isTS }) => {
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
    expect(findGlobals(file.getFilePath(), project)).toEqual([
      '__filename',
      'process',
    ])
  })

  it('returns globals variable with typeof', () => {
    file.replaceWithText(`
      if (typeof process !== 'undefined') {
        console.log('in node')
      }
    `)
    expect(findGlobals(file.getFilePath(), project)).toEqual(['process'])
  })

  it('returns globals variables used as parameters', () => {
    file.replaceWithText(`
      console.log('in node', __dirname)
    `)
    expect(findGlobals(file.getFilePath(), project)).toEqual(['__dirname'])
  })

  it('returns globals variables in instructions', () => {
    file.replaceWithText(`
      while(__dirname) {
        for (const key in exports) {}
      }
    `)
    expect(findGlobals(file.getFilePath(), project)).toEqual([
      '__dirname',
      'exports',
    ])
  })

  it('returns globals used with static methods', () => {
    file.replaceWithText(`
      function foo() {
        return Response.redirect(Buffer.from('ok'))
      }
    `)
    expect(findGlobals(file.getFilePath(), project)).toEqual(['Buffer'])
  })

  it('returns globals used with new operator', () => {
    file.replaceWithText(`new Buffer(['o', 'k'])`)
    expect(findGlobals(file.getFilePath(), project)).toEqual(['Buffer'])
  })

  it('returns globals used as properties', () => {
    file.replaceWithText(`Buffer.poolSize`)
    expect(findGlobals(file.getFilePath(), project)).toEqual(['Buffer'])
  })

  it('returns globals used as functions', () => {
    file.replaceWithText(`
      setImmediate(() => {
        $('.do-you[remember="the time"]')
      })
    `)
    expect(findGlobals(file.getFilePath(), project)).toEqual([
      'setImmediate',
      '$',
    ])
  })

  it('ignores known DOM globals', () => {
    file.replaceWithText(`
      console.log(JSON.stringify({ msg: btoa('hi') }))
      const controller = new AbortController()
    `)
    // no console, JSON, btoa, AbortController
    expect(findGlobals(file.getFilePath(), project)).toEqual([])
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
    expect(findGlobals(file.getFilePath(), project)).toEqual(['Buffer'])
  })

  it('finds globals from 3rd party code', async () => {
    const file = project.addSourceFileAtPath(
      join(fixtureFolder, 'with-axios.out.js')
    )
    expect(findGlobals(file.getFilePath(), project)).toEqual([
      'self',
      'window',
      'global',
      'Buffer',
      'navigator',
      'document',
      'WorkerGlobalScope',
      'XMLHttpRequest',
    ])
  })
})
