import { exec } from 'child_process'
import { promisify } from 'util'
import { resolve } from 'path'

jest.setTimeout(20000)

it('handles correctly unhandled rejections', async () => {
  const execAsync = promisify(exec)
  const result = await execAsync(
    `ts-node --transpile-only ${resolve(__dirname, 'unhandled-rejection.ts')}`,
    { encoding: 'utf8' }
  )
  expect(result.stdout).toContain('TEST PASSED!')
})
