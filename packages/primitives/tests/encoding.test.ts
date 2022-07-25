import { TextDecoder } from '../encoding'

test('TextDecoder', () => {
  const input = new Uint8Array([
    101, 100, 103, 101, 45, 112, 105, 110, 103, 46, 118, 101, 114, 99, 101, 108,
    46, 97, 112, 112,
  ])

  const utf8Decoder = new TextDecoder('utf-8', { ignoreBOM: true })
  const output = utf8Decoder.decode(input)
  expect(output).toBe('edge-ping.vercel.app')
})
