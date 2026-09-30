#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()
const SKIP = new Set(['node_modules', '.git', 'dist', 'target', 'wasm', 'output'])
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.rs', '.toml', '.yml', '.yaml', '.env'])
const PATTERNS = [
  { name: 'PEM_PRIVATE', re: /-----BEGIN[\s\w]*PRIVATE KEY-----/i },
  { name: 'VITE_CODEHASH_HARDCODE', re: /VITE_\w+_CODEHASH_OK\s*=\s*['"]1['"]/ },
]

function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of entries) {
    if (SKIP.has(name)) continue
    const p = join(dir, name)
    let st
    try {
      st = statSync(p)
    } catch {
      continue
    }
    if (st.isDirectory()) walk(p, out)
    else if (EXT.has(name.slice(name.lastIndexOf('.'))) || name.startsWith('.env')) out.push(p)
  }
  return out
}

const hits = []
for (const f of walk(ROOT)) {
  if (f.includes('check-no-secrets')) continue
  let text
  try {
    text = readFileSync(f, 'utf8')
  } catch {
    continue
  }
  if (text.length > 1_500_000) continue
  for (const { name, re } of PATTERNS) {
    if (re.test(text)) hits.push({ file: f.replace(ROOT + '/', ''), rule: name })
  }
}
if (hits.length) {
  console.error('check-no-secrets: FAILED')
  hits.forEach(h => console.error('  [' + h.rule + '] ' + h.file))
  process.exit(1)
}
console.log('check-no-secrets: OK')
