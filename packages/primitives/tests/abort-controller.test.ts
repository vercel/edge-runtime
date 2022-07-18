import { AbortController } from '../abort-controller'
import { fetch } from '../fetch'

it('allows to abort fetch', async () => {
  expect.assertions(1)
  const controller = new AbortController()
  controller.abort()

  try {
    await fetch('https://example.vercel.sh', {
      signal: controller.signal,
    })
  } catch (error: any) {
    expect(error.message).toEqual('The operation was aborted')
  }
})
