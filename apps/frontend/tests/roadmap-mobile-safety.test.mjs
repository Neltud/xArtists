import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const css = readFileSync(new URL('../src/experience/mobile-contrast-fixes.css', import.meta.url), 'utf8')
const roadmap = readFileSync(new URL('../src/experience/PublicRoadmap.tsx', import.meta.url), 'utf8')

test('mobile roadmap keeps every selected module linked and visible', () => {
  assert.match(roadmap, /PICKS\[stage\]\.map/)
  assert.match(roadmap, /<Link key=\{id\} to=\{m\.path\}>/)
  assert.match(css, /\.xa-roadmap-selected > a\s*\{[^}]*min-height:\s*64px/s)
  assert.match(css, /\.xa-roadmap-selected > a\s*\{[^}]*overflow-wrap:\s*anywhere/s)
  assert.doesNotMatch(css, /\.xa-roadmap-selected\s*\{[^}]*display:\s*none/s)
})

test('fixed mobile dock and roadmap retain safe-area and keyboard navigation', () => {
  assert.match(css, /\.xa-roadmap-page\s*\{[^}]*env\(safe-area-inset-bottom/s)
  assert.match(css, /\.xa-mobile-dock a:focus-visible\s*\{/)
  assert.match(css, /\.xa-roadmap-page a:focus-visible/)
})
