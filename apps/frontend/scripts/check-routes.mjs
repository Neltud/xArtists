#!/usr/bin/env node
/**
 * check-routes.mjs — fail if routeRegistry aliases/modules are missing from App.tsx
 * or if critical paths are absent from the registry.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const appTsx = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8')
const registry = fs.readFileSync(path.join(root, 'src/config/routeRegistry.ts'), 'utf8')

const critical = ['/', '/museum', '/market', '/agents', '/wallet', '/staking', '/lia', '/tca', '/command-center']
const missing = []

for (const p of critical) {
  const inRegistry = registry.includes(`path: '${p}'`) || registry.includes(`path: "${p}"`)
  if (!inRegistry) missing.push(`registry missing ${p}`)
}

// App must import ROUTE_ALIASES and render NotFound (no silent * → /)
if (!appTsx.includes('ROUTE_ALIASES')) missing.push('App.tsx missing ROUTE_ALIASES import')
if (!appTsx.includes('NotFoundPage') && !appTsx.includes('NotFound')) {
  missing.push('App.tsx missing NotFoundPage')
}

// Slot must redirect away
if (!appTsx.includes("/slot") && !registry.includes("'/slot'")) {
  missing.push('no /slot alias or route handling')
}

if (missing.length) {
  console.error('check-routes FAILED:')
  for (const m of missing) console.error(' -', m)
  process.exit(1)
}

console.log('check-routes OK — critical paths + aliases present')
