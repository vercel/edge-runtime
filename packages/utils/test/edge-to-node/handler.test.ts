import { transformToNode } from '../../src'

describe('transformToNode()', () => {
  it('is a no-op', () => {
    expect(transformToNode()).toBeUndefined()
  })
})
