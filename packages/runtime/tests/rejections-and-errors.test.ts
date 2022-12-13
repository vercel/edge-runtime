import { exec } from 'child_process'
import { promisify } from 'util'
import { resolve } from 'path'

jest.setTimeout(2000)
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

it('handles correctly uncaught exceptions', async () => {
  const result = await execAsync(
    `ts-node --transpile-only ${resolve(
      __dirname,
      './fixtures/uncaught-exception.ts'
    )}`,
    { encoding: 'utf8' }
  )
  expect(result).toMatchObject({
    stdout: expect.stringContaining('TEST PASSED!'),
    stderr: '',
  })
})

it('does not swallow uncaught exceptions outside of evaluation', async () => {
  const execAsync = promisify(exec)
  await expect(
    execAsync(
      `ts-node --transpile-only ${resolve(
        __dirname,
        './fixtures/legit-uncaught-exception.ts'
      )}`,
      { encoding: 'utf8' }
    )
  ).rejects.toThrow(/intentional break/)
})

it('does not swallow unhandled rejections outside of evaluation', async () => {
  const execAsync = promisify(exec)
  await expect(
    execAsync(
      `ts-node --transpile-only ${resolve(
        __dirname,
        './fixtures/legit-unhandled-rejection.ts'
      )}`,
      { encoding: 'utf8' }
    )
  ).rejects.toThrow(/intentional break/)
})
