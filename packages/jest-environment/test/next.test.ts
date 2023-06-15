/**
 * @jest-environment ./dist
 */

import { redirect } from 'next/navigation'

test('it should works fine with next internals', async () => {
  expect(redirect).toBeDefined()
})
