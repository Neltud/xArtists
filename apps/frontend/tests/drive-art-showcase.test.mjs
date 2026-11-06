import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import { test } from 'node:test'

const root = new URL('../public/art/drive/', import.meta.url)
const p = new URL('../src/experience/DriveArtShowcase.tsx', import.meta.url)
const css = new URL('../src/experience/drive-art.css', import.meta.url)
const file = readFileSync(p, 'utf8')
const styles = readFileSync(css, 'utf8')
const home = readFileSync(new URL('../src/experience/Pages.tsx', import.meta.url), 'utf8')
const museum = readFileSync(new URL('../src/pages/MuseumPage.tsx', import.meta.url), 'utf8')
const sourceFiles = [
  'xArtists0279.png', 'xArtists0269.png', 'xArtists0291.png',
  'xArtists0286.png', 'genesis-pulse-005-recto-galerie-HD.png',
]

test('all selected original Drive artworks exist and are actual PNG files', () => {
  const signature = Buffer.from('89504e470d0a1a0a', 'hex')
  for (const name of sourceFiles) {
    const path = new URL(name, root)
    const bytes = readFileSync(path)
    assert.ok(bytes.length > 1000, name + ' too small')
    assert.ok(bytes.subarray(0, 8).equals(signature), name + ' is not PNG')
    assert.ok(statSync(path).isFile())
  }
})

test('exhibit only, never falsely describe originals as live listings or mints', () => {
  assert.match(file, /no implied listing, sale or mint/)
  assert.match(file, /sans offre de vente ou mint implicite/)
  assert.ok(!/mintEnabled:\s*true|paymentEnabled:\s*true|sendTransaction\(/.test(file))
  for (const work of sourceFiles.slice(0, 4)) assert.ok(file.includes(work))
  assert.ok(home.includes('<DriveArtShowcase />'))
  assert.ok(museum.includes('<DriveArtShowcase compact />'))
})

test('responsive gallery respects users who request less animation', () => {
  assert.match(styles, /@media\(max-width:650px\)/)
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/)
  assert.match(styles, /object-fit:contain/)
  assert.match(styles, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/)
})
