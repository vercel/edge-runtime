import buildConfig from '../../jest.config'
import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  ...buildConfig(__dirname),
  testEnvironment: '@edge-runtime/jest-environment',
  setupFiles: ['<rootDir>/jest.node.setup.js'],
}
export default config
