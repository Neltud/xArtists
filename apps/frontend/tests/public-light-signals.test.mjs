import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')

test('light is default before React mounts, with a persisted dark choice', () => {
  const html = read('../index.html')
  const state = read('../src/experience/state.tsx')
  const shell = read('../src/experience/Shell.tsx')
  const css = read('../src/experience/experience.css')
  assert.match(html, /<html lang="fr" data-theme="light">/)
  assert.match(html, /localStorage.getItem\("xa-theme"\) === "dark" \? "dark" : "light"/)
  assert.match(state, /stored\('xa-theme'\)==='dark'\?'dark':'light'/)
  assert.match(state, /classList.toggle\('dark',theme==='dark'\)/)
  assert.match(shell, /xa-theme-toggle/)
  assert.match(css, /html\[data-theme=dark\]/)
  assert.match(css, /color-scheme:light/)
})

test('pack hologram is a static, sourced-status placeholder, not fake live telemetry', () => {
  const hologram = read('../src/components/HoloDataRoom.tsx')
  assert.match(hologram, /Static pack overview/)
  assert.doesNotMatch(hologram, /requestAnimationFrame|Math\.sin|WebGLRenderer|fetchSnap\(/)
  assert.match(hologram, /No authenticated, timestamped agent feed/)
})

test('agent monitor has no random synthetic ticks or BUY SELL pseudo-orders', () => {
  const monitor = read('../src/components/PackAgentMonitor.tsx')
  assert.doesNotMatch(monitor, /Math\.random|seedSignals|setInterval|LONG\s*\/\s*SHORT/)
  assert.match(monitor, /No certified data/)
})

test('public cockpit does not fabricate TRO quote, model voting or news impact', () => {
  const cockpit = read('../src/components/packs/Pack3DCockpit.tsx')
  assert.doesNotMatch(cockpit, /troApprox|fearGreed|setSignals|sideRaw|GOV_SPLIT/)
  assert.match(cockpit, /No inferred EGLD price/)
  assert.match(cockpit, /staked \$TRO/)
})

test('homepage carries explicit public posture and editions are non-moving illustrative previews', () => {
  const page = read('../src/experience/Pages.tsx')
  const shelf = read('../src/components/packs/GenesisPackShelf.tsx')
  const card = read('../src/components/packs/GenesisCard3D.tsx')
  assert.match(page, /xa-public-trust/)
  assert.match(page, /strictement proportionnel aux \$TRO stakés/)
  assert.match(page, /to="\/lia" className="xa-access-home-link"/)
  assert.match(shelf, /autoRotate=\{false\}/)
  assert.match(shelf, /numéros d’édition illustratifs, non mintés/)
  assert.match(card, /autoRotate = false,/)
})
