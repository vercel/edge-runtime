import { Server, createServer, IncomingMessage, ServerResponse } from 'http'
// @ts-ignore package `http-body` doesn't export type
import * as httpBody from 'http-body'
import listen from 'test-listen'
import multer from 'multer'

import { FormData, fetch, Headers } from '../fetch'
import { URL } from '../url'

let server: Server
afterEach(() => new Promise((resolve) => server.close(resolve)))

test('perform a POST as application/json', async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'POST') {
      res.statusCode = 400
      res.end()
    }

    if (req.headers['content-type'] === 'application/json') {
      const text = await httpBody.text(req)
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Length', Buffer.byteLength(text))
      res.end(text)
      return
    }
    res.statusCode = 400
    res.end()
  })

  const serverUrl = await listen(server)
  const response = await fetch(serverUrl, {
    method: 'POST',
    body: JSON.stringify({ foo: 'bar' }),
    headers: {
      'content-type': 'application/json',
    },
  })

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ foo: 'bar' })
})

test('perform a POST as application/x-www-form-urlencoded', async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'POST') {
      res.statusCode = 400
      res.end()
    }

    if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
      const text = await httpBody.text(req)
      const urlSearchParam = new URLSearchParams(text)
      const urlEncoded = JSON.stringify(
        Object.fromEntries(urlSearchParam.entries())
      )
      res.statusCode = 200
      res.end(urlEncoded)
      return
    }
    res.statusCode = 400
    res.end()
  })

  const serverUrl = await listen(server)
  const response = await fetch(serverUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ foo: 'bar' }),
  })

  expect(response.status).toBe(200)
  const json = await response.json()
  expect(json).toEqual({ foo: 'bar' })
})

test('perform a POST as multipart/form-data', async () => {
  const upload = multer({ storage: multer.memoryStorage() })
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (
      req.method !== 'POST' ||
      !req.headers['content-type']?.startsWith('multipart/form-data')
    ) {
      res.statusCode = 400
      res.end()
    }
    upload.none()(req as any, res as any, () => {
      res.statusCode = 200
      // @ts-expect-error
      res.end(JSON.stringify(req.body))
      return
    })
  })

  const serverUrl = await listen(server)

  const formData = new FormData()
  formData.append('company', 'vercel')
  formData.append('project', 'edge-runtime')

  const response = await fetch(serverUrl, {
    method: 'POST',
    body: formData,
  })

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({
    company: 'vercel',
    project: 'edge-runtime',
  })
})

test('sets header calling Headers constructor', async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    res.end(req.headers['user-agent'])
  })
  const serverUrl = await listen(server)
  const response = await fetch(serverUrl, {
    headers: new Headers({ 'user-agent': 'vercel/edge-runtime' }),
  })
  expect(response.status).toBe(200)
  const text = await response.text()
  expect(text).toBe('vercel/edge-runtime')
})

test('sets headers unsupported in undici', async () => {
  const url = new URL('/', 'https://example.vercel.sh')
  const response = await fetch(url, {
    headers: {
      Connection: 'keep-alive',
      'Keep-Alive': 'timeout=5, max=1000',
    },
  })
  expect(response.status).toBe(200)
})
