import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const css = read('../src/experience/commercial-visual-polish.css')
const app = read('../src/App.tsx')
const offers = read('../src/pages/CommercialLaunchPage.tsx')
const pack = read('../src/pages/PackLandingPage.tsx')
const agents = read('../src/pages/Agents.tsx')
const shelf = read('../src/components/packs/GenesisPackShelf.tsx')
const studio = read('../src/pages/StudioPage.tsx')

// sRGB contrast check of the explicit amber text/background pairs used in
// light/dark status components. WCAG AA body text requires >= 4.5:1.
function luminance(hex) {
  const channels = hex.match(/\w\w/g).map(s => parseInt(s, 16) / 255)
  const linear = channels.map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
}
function ratio(foreground, background) {
  const a = luminance(foreground.slice(1))
  const b = luminance(background.slice(1))
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

test('polish CSS is scoped to commercial discovery and loads after existing contrast repairs', () => {
  assert.ok(app.indexOf("import './experience/mobile-contrast-fixes.css'") <
    app.indexOf("import './experience/commercial-visual-polish.css'"))
  for (const name of ['xa-offers-page', 'xa-pack-detail', 'xa-agents-discovery', 'xa-creator-studio', 'xa-genesis-polished']) {
    assert.match(css, new RegExp('\\.' + name))
  }
  assert.doesNotMatch(css, /(?:^|\n)\s*(?:body|html|\*|:root)\s*\{/)
  assert.match(css, /prefers-reduced-motion: reduce/)
})

test('light and dark unavailable statuses exceed 4.5:1 contrast', () => {
  const pairs = [['#634412', '#fff9ed'], ['#fae9c8', '#2b251c']]
  for (const [fg, bg] of pairs) {
    assert.ok(ratio(fg, bg) >= 4.5, `${fg}/${bg} contrast ${ratio(fg, bg)}`)
    assert.ok(css.includes(fg) && css.includes(bg))
  }
  assert.match(offers, /xa-offers-status/)
  assert.match(pack, /xa-pack-status/)
  assert.match(agents, /xa-agent-notice/)
})

test('offers and Genesis use aligned readable cards with mobile actions and no sale intent', () => {
  for (const needle of ['xa-offers-hero', 'xa-offers-card', 'xa-offers-steps', 'xa-offers-trust']) {
    assert.ok(offers.includes(needle), needle)
  }
  assert.match(offers, /auto-rows-fr/)
  assert.match(css, /max-width: 640px/)
  assert.match(css, /width: 100%;/)
  assert.match(css, /:focus-visible/)
  assert.match(pack, /xa-pack-info-card/)
  assert.match(shelf, /xa-genesis-polished/)
  assert.doesNotMatch(shelf, /boxShadow: visual\.glow/)
  assert.doesNotMatch(agents, /boxShadow: isSel \? vis\.glow/)
  assert.doesNotMatch(agents, /PackCheckout|PackOpenTheater/)
  assert.doesNotMatch(offers, /<PackCheckout|<CheckoutModal/)
})

test('Agents choice is keyboard-readable and exposes selected state; never a buy control', () => {
  assert.match(agents, /aria-pressed=\{isSel\}/)
  assert.match(agents, /xa-agent-choice/)
  assert.match(css, /aria-pressed="true"/)
  assert.match(agents, /Vente NFT indisponible/)
})

test('Creator Studio uses theme tokens for foreground and input backgrounds', () => {
  assert.match(studio, /xa-creator-studio/)
  assert.match(studio, /xa-studio-workflow/)
  for (const legacy of ['text-white', 'bg-zinc-950', 'border-white/10']) {
    assert.ok(!studio.includes(legacy), 'Studio retained dark-only ' + legacy)
  }
  assert.match(css, /min-height: 44px/)
  assert.match(css, /--xa-bg-elevated/)
  assert.match(css, /html\[data-theme="light"\]/)
  assert.match(css, /html\[data-theme="dark"\]/)
  assert.match(studio, /to="\/offres"/)
  assert.doesNotMatch(studio, /PackCheckout/)
})
