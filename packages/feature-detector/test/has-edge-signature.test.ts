import { hasEdgeSignature } from '../src'
import { initTestProjectAndFiles } from './test-utils'

const { project, jsFile, tsFile } = initTestProjectAndFiles()

describe.each([
  { title: 'for JavaScript', file: jsFile },
  { title: 'for TypeScript', file: tsFile },
])('hasEdgeSignature() $title', ({ file }) => {
  it('handles no default export', () => {
    file.replaceWithText(`
      function foo() {
        return new Response('ok')
      }
    `)
    expect(hasEdgeSignature(file.getFilePath(), project)).toBe(false)
  })

  it('handles non-function default export', () => {
    file.replaceWithText(`export default 'bar'`)
    expect(hasEdgeSignature(file.getFilePath(), project)).toBe(false)
  })

  it('does not detect function declaration returning nothing', () => {
    file.replaceWithText(`
      export default function() {}
    `)
    expect(hasEdgeSignature(file.getFilePath(), project)).toBe(false)
  })

  it('detects function declaration returning a response', () => {
    file.replaceWithText(`
      export default function() {
        return new Response('ok')
      }
    `)
    expect(hasEdgeSignature(file.getFilePath(), project)).toBe(true)
  })

  it('detects function declaration returning a response promise', () => {
    file.replaceWithText(`
      export default function() {
        return Promise.resolve(new Response('ok'))
      }
    `)
    expect(hasEdgeSignature(file.getFilePath(), project)).toBe(true)
  })

  it('detects async named function returning a response', () => {
    file.replaceWithText(`
      export default async function handler() {
        return new Response('ok')
      }
    `)
    expect(hasEdgeSignature(file.getFilePath(), project)).toBe(true)
  })

  it('detects function expression returning a response', () => {
    file.replaceWithText(`
      export default () => {
        return new Response('ok')
      }
    `)
    expect(hasEdgeSignature(file.getFilePath(), project)).toBe(true)
  })

  it('detects exported named function returning a response', () => {
    file.replaceWithText(`
      function handler() {
        return new Response('ok')
      }
      export default handler
    `)
    expect(hasEdgeSignature(file.getFilePath(), project)).toBe(true)
  })

  it('detects use of Response.error()', () => {
    file.replaceWithText(`
      export default function() {
        return Response.error()
      }
    `)
    expect(hasEdgeSignature(file.getFilePath(), project)).toBe(true)
  })

  it('detects use of Response.redirect()', () => {
    file.replaceWithText(`
      export default function() {
        return Response.redirect('/works')
      }
    `)
    expect(hasEdgeSignature(file.getFilePath(), project)).toBe(true)
  })

  it('detects use of Response.json()', () => {
    file.replaceWithText(`
      export default function() {
        return Response.json({ msg: '/works' })
      }
    `)
    expect(hasEdgeSignature(file.getFilePath(), project)).toBe(true)
  })

  it('detects use of NextResponse', () => {
    file.replaceWithText(`
      import { NextResponse } from 'next/server'
      export default function() {
        return NextResponse.next()
      }
    `)
    expect(hasEdgeSignature(file.getFilePath(), project)).toBe(true)
  })

  it('detects use of NextResponse in async function', () => {
    file.replaceWithText(`
      import { NextResponse } from 'next/server'
      export default async function() {
        return NextResponse.rewrite('/home')
      }
    `)
    expect(hasEdgeSignature(file.getFilePath(), project)).toBe(true)
  })

  it('detects use of fetch', () => {
    file.replaceWithText(`
      export default function() {
        return fetch('https://example.vercel.sh')
      }
    `)
    expect(hasEdgeSignature(file.getFilePath(), project)).toBe(true)
  })
})
