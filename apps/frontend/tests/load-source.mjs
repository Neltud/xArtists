import { buildSync } from 'esbuild'
import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const frontend = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

export function loadSource(relPath) {
  const entry = resolve(frontend, relPath)
  const result = buildSync({
    entryPoints: [entry],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    packages: 'external',
  })
  return result.outputFiles[0].text
}
