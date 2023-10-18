import { ReadableStream } from 'node:stream/web'

import { consumeUint8ArrayReadableStream } from '../src/server/body-streams'

describe('consumeUint8ArrayReadableStream', () => {
  test('closes body stream when iteration breaks', async () => {
    const pull = jest.fn((controller: ReadableStreamDefaultController) => {
      controller.enqueue(new Uint8Array(pull.mock.calls.length))
    })
    const cancel = jest.fn()
    const readable: any = new ReadableStream({
      pull,
      cancel,
    })

    const consumable = consumeUint8ArrayReadableStream(readable)
    for await (const chunk of consumable) {
      expect(chunk).toEqual(new Uint8Array([0]))
      break
    }
    expect(pull).toBeCalledTimes(2)
    expect(cancel).toBeCalledTimes(1)
    expect(cancel).toBeCalledWith(undefined)
  })
})
