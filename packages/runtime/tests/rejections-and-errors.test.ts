import { exec } from 'child_process'
import { promisify } from 'util'
import { resolve } from 'path'

jest.setTimeout(20000)
const execAsync = promisify(exec)

it('handles correctly unhandled rejections', async () => {
  const result = await execAsync(
    `ts-node --transpile-only ${resolve(
      __dirname,
      './fixtures/unhandled-rejection.ts'
    )}`,
    { encoding: 'utf8' }
  )
  expect(result).toMatchObject({
    stdout: expect.stringContaining('TEST PASSED!'),
    stderr: '',
  })
})
