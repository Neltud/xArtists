import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const lab = readFileSync(new URL('../src/components/ArtworkTurntableLab.tsx', import.meta.url), 'utf8')
const studio = readFileSync(new URL('../src/pages/StudioPage.tsx', import.meta.url), 'utf8')

test('Creator Studio exposes the local touch turntable lab before publication', () => {
  assert.match(studio, /import ArtworkTurntableLab from '\.\.\/components\/ArtworkTurntableLab'/)
  assert.match(studio, /<ArtworkTurntableLab \/>/)
  assert.ok(studio.indexOf('<ArtworkTurntableLab />') < studio.indexOf('<CreatorMediaUpload title='))
})

test('turntable accepts only local still photos with explicit resource limits', () => {
  assert.match(lab, /image\/jpeg/)
  assert.match(lab, /image\/png/)
  assert.match(lab, /image\/webp/)
  assert.match(lab, /const MAX_FILES = 36/)
  assert.match(lab, /const MIN_FRAMES = 4/)
  assert.match(lab, /MAX_TOTAL_BYTES/)
  assert.match(lab, /URL\.createObjectURL/)
  assert.match(lab, /URL\.revokeObjectURL/)
  assert.doesNotMatch(lab, /\bfetch\s*\(/)
  assert.doesNotMatch(lab, /localStorage|sessionStorage|wallet.*sign/i)
})

test('turntable is a preview, not falsely described as certified 3D', () => {
  assert.match(lab, /aucun fichier n’est envoyé au serveur, publié ou minté/)
  assert.match(lab, /pas une reconstruction 3D certifiée/)
  assert.match(lab, /Ordre des vues/)
})

test('turntable has accessible controls and reduced-motion guard', () => {
  assert.match(lab, /onPointerDown=/)
  assert.match(lab, /onPointerMove=/)
  assert.match(lab, /onKeyDown=/)
  assert.match(lab, /prefers-reduced-motion: reduce/)
  assert.match(lab, /aria-pressed=\{playing\}/)
  assert.match(lab, /visibilitychange/)
  assert.match(lab, /role="alert"/)
})
