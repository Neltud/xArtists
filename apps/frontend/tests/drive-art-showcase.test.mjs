import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import { test } from 'node:test'

const root = new URL('../public/art/drive/', import.meta.url)
const p = new URL('../src/experience/DriveNftDistributor.tsx', import.meta.url)
const css = new URL('../src/experience/drive-art.css', import.meta.url)
const file = readFileSync(p, 'utf8')
const styles = readFileSync(css, 'utf8')
const home = readFileSync(new URL('../src/experience/Pages.tsx', import.meta.url), 'utf8')
const museum = readFileSync(new URL('../src/pages/MuseumPage.tsx', import.meta.url), 'utf8')
const sourceFiles = [
  'xArtists0279.png', 'xArtists0269.png', 'xArtists0291.png', 'xArtists0286.png',
]

test('distributor previews use only the four already published Drive PNG assets', () => {
  const signature = Buffer.from('89504e470d0a1a0a', 'hex')
  for (const name of sourceFiles) {
    const bytes = readFileSync(new URL(name, root))
    assert.ok(bytes.length > 1000, name + ' too small')
    assert.ok(bytes.subarray(0, 8).equals(signature), name + ' is not PNG')
    assert.ok(statSync(new URL(name, root)).isFile())
    assert.ok(file.includes(name), name + ' absent from preview manifest')
  }
  assert.doesNotMatch(file, /drive\.google\.com\/file\/d\//)
})

test('random distributor is positioned below the 3D museum, not on homepage or above the museum', () => {
  assert.doesNotMatch(home, /DriveArtShowcase|DriveNftDistributor|Original artworks|Œuvres originales/)
  assert.match(museum, /import DriveNftDistributor from/)
  assert.doesNotMatch(museum, /DriveArtShowcase/)
  const hall = museum.indexOf('<MuseumHall')
  const grid = museum.indexOf('<ArtworkGrid frames={hallFrames} title={xaLocalize("Œuvres de la salle")}')
  const draw = museum.indexOf("<DriveNftDistributor />")
  assert.ok(hall >= 0 && grid > hall && draw > grid)
  assert.match(museum, /museumId === 'xartists' && <DriveNftDistributor \/>/)
})

test('random selector is cryptographic preview-only with no wallet or payment', () => {
  assert.match(file, /globalThis\.crypto\.getRandomValues/)
  assert.match(file, /range - \(range % size\)/)
  assert.doesNotMatch(file, /Math\.random\(/)
  assert.match(file, /data-mode="preview-only"/)
  assert.match(file, /ne crée, ne réserve, ne vend et ne transfère aucun NFT/)
  assert.match(file, /does not mint, reserve, sell or transfer an NFT/)
  assert.doesNotMatch(file, /sendTransaction\(|mintEnabled:\s*true|paymentEnabled:\s*true|wallet.*sign/i)
})

test('distributor is responsive, accessible and supports reduced motion', () => {
  assert.match(file, /aria-live="polite"/)
  assert.match(file, /type="button" onClick={draw}/)
  assert.match(file, /<Link className="xa-drive-distributor__studio" to="\/studio">/)
  assert.match(styles, /@media\(max-width:650px\)/)
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/)
  assert.match(styles, /object-fit: contain/)
})
