import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const out = mkdtempSync(join(tmpdir(), 'kr-review-'))

await build({
  entryPoints: ['src/lib/protocolPulse.ts'],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  outfile: join(out, 'protocolPulse.mjs'),
  define: { 'import.meta.env': '{}' },
  logLevel: 'silent',
})

const { upbitPosture, egldFromAtomic } = await import(pathToFileURL(join(out, 'protocolPulse.mjs')).href)

test('korean review stays paper through the official extension', () => {
  assert.equal(upbitPosture(Date.parse('2026-10-18T22:00:00Z')).phase, 'before')
  const d3 = upbitPosture(Date.parse('2026-10-21T04:30:00Z'))
  assert.equal(d3.phase, 'window')
  assert.equal(d3.day, 3)
  const ext = upbitPosture(Date.parse('2026-10-24T04:40:00Z'))
  assert.equal(ext.phase, 'extended')
  assert.equal(ext.day, 1)
  assert.match(ext.label, /207379109/)
  assert.match(ext.label, /VITE_LIA_LIVE_TRADING/)
  assert.equal(upbitPosture(Date.parse('2026-11-21T00:00:00Z')).phase, 'after')
  assert.equal(egldFromAtomic('1585598000000000000').toFixed(6), '1.585598')
})
