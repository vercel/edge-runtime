import { defineConfig } from 'tsup'

export default defineConfig({
  dts: true,
  entry: ['./src/index.ts'],
  format: ['cjs', 'esm'],
  target: 'node18',
  tsconfig: './tsconfig.prod.json',
})
