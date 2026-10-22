import { buildSync } from 'esbuild'
import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const frontend = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

export function loadSource(filename, env = {}) {
  const result = buildSync({
    entryPoints: [resolve(frontend, filename)],
    bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
    external: ['react', 'react-dom', 'react/jsx-runtime', '@multiversx/sdk-core'],
    define: { 'import.meta.env': JSON.stringify(env) }, logLevel: 'silent',
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, module, module.exports)
  return module.exports
}
