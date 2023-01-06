import buildConfig from '../../jest.config'
import type { Config } from '@jest/types'

const config: Config.InitialOptions = buildConfig(__dirname)
config.transform!['\\.txt$'] = 'jest-text-transformer'
export default config
