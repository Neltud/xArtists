import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8')

test('museum selector has keyboard-accessible active states and large mobile targets', () => {
  const page = src('pages/MuseumPage.tsx')
  assert.match(page, /role="group" aria-label="Parcours du musée"/)
  assert.match(page, /aria-pressed=\{mode === m\}/)
  assert.match(page, /min-h-\[44px\]/)
  assert.match(page, /text-\[13px\] leading-snug/)
  assert.doesNotMatch(page, /text-\[11px\] text-zinc-300 truncate px-2 py-1/)
})

test('the WebGL museum HUD has readable scoped mobile styles and visible keyboard focus', () => {
  const css = src('experience/museum-a11y.css')
  const app = src('App.tsx')
  assert.match(app, /import '\.\/experience\/museum-a11y\.css'/)
  assert.match(css, /\.xa-museum-stage \.xa-museum-art-tour button/)
  assert.match(css, /min-height: 44px/)
  assert.match(css, /focus-visible/)
  assert.match(css, /max-width: 390px/)
  assert.match(css, /prefers-reduced-motion: reduce/)
})

test('both CSS fallback gallery engines name artwork buttons and allow keyboard movement', () => {
  for (const path of ['components/museum/MuseumBlueprintRoom.tsx', 'components/museum/MuseumGameHall.tsx']) {
    const source = src(path)
    assert.match(source, /onKeyDown=\{e => \{ if \(e\.key === ' '/)
    assert.match(source, /onKeyUp=\{e => \{ if \(e\.key === ' '/)
    assert.match(source, /onBlur=\{\(\) =>/)
    assert.match(source, /aria-label=\{`Détails de l’œuvre : \$\{inspect\.title\}`\}/)
    assert.match(source, /alt=\{inspect\.title\}/)
    assert.match(source, /focus-visible:outline/)
  }
})

test('museum update does not release Genesis pack checkout or LIA trading', () => {
  const status = src('config/scStatus.ts')
  assert.match(status, /AGENT_PACK_PUBLIC_MINT_RELEASED = false/)
  assert.match(status, /AGENT_PACK_PUBLIC_COMMERCE_RELEASED = false/)
})
