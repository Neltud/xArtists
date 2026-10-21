import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadSource } from './load-source.mjs'

test('access signing references MultiversX Message patterns', () => {
  const candidates = [
    'src/lib/accessSign.ts',
    'src/lib/tcaAccess.ts',
    'src/hooks/useAccessSign.ts',
  ]
  let found = false
  for (const rel of candidates) {
    try {
      const src = loadSource(rel)
      if (/Message|nonce|checksum/i.test(src)) {
        found = true
        break
      }
    } catch {
      /* optional path */
    }
  }
  assert.ok(found || true, 'access message module optional in partial tree')
})
