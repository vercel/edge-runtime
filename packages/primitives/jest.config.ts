import buildConfig from '../../jest.config'
import type { Config } from '@jest/types'

const config: Config.InitialOptions = buildConfig(__dirname)
export default config
