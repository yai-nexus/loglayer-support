import { defineConfig } from 'tsup'

export const createTsupConfig = (options = {}) => {
  return defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    minify: false,
    target: 'es2020',
    ...options
  })
}

export default createTsupConfig()