import { defineConfig } from 'tsup'

export default defineConfig({
  dts: { resolve: true },
  entry: ['./src/index.ts'],
  format: ['cjs', 'esm'],
  tsconfig: './tsconfig.prod.json',
})
