import type { Config } from '@jest/types'
import path from 'path'

export default (rootDir: string): Config.InitialOptions => {
  return {
    rootDir,
    setupFilesAfterEnv: [path.join(__dirname, 'jest.setup.js')],
    transform: {
      '^.+\\.tsx?$': [
        'ts-jest',
        {
          'diagnostics': true,
          'isolatedModules': true,
        },
      ],
    },
    preset: 'ts-jest/presets/default',
    testEnvironment: 'node',
    watchPlugins: [
      'jest-watch-typeahead/filename',
      'jest-watch-typeahead/testname',
    ],
    collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}'],
  }
}
