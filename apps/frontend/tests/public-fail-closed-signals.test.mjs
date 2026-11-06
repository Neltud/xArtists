import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const frontend = path => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8')
const html = () => readFileSync(new URL('../index.html', import.meta.url), 'utf8')

test('all three public pack holograms stay static without invented metrics', () => {
  const holo = frontend('components/lia/holoRenderers.ts')
  const room = frontend('components/lia/LiaHubControlRoom.tsx')
  const lazy = frontend('components/lia/LiaHubControlRoomLazy.tsx')
  for (const pack of ['Pulse', 'Yield', 'Sentinel']) {
    assert.match(holo, new RegExp('draw' + pack + 'Screen'))
    assert.match(room, new RegExp('mode="' + pack.toLowerCase() + '"'))
  }
  assert.doesNotMatch(holo, /Math\.sin\(|Math\.random\(|requestAnimationFrame\(|APR est\.|Quality score|TXX\/s/)
  assert.doesNotMatch(room, /WebGLRenderer|requestAnimationFrame\(|setInterval\(/)
  assert.doesNotMatch(lazy, /lazy\(\(\) => import|Enter immersive view/)
  assert.match(lazy, /Vue holographique suspendue/)
})

test('Pulse cannot broadcast seeded telemetry or trigger browser intents', () => {
  const hook = frontend('hooks/usePulse.ts')
  const museum = frontend('components/museum/museumPulseBind.ts')
  const bridge = frontend('lib/agent8008Bridge.ts')
  const strip = frontend('components/PulseStrip.tsx')
  assert.match(hook, /category: 'UNVERIFIED'/)
  assert.match(hook, /connected: false/)
  assert.doesNotMatch(hook, /PULSE_DEMO_CYCLE|setInterval\(|new WebSocket\(|dispatchEvent\(|fetch\(/)
  assert.doesNotMatch(museum, /addEventListener\('xartists:pulse'/)
  assert.doesNotMatch(bridge, /addEventListener\('xartists:pulse'/)
  assert.doesNotMatch(strip, /animate-pulse|sentPct|transition-all/)
})

test('Command Center cards, tape and meters do not imply verified agent activity', () => {
  const tape = frontend('command-center/MarketTape.tsx')
  const orb = frontend('command-center/AgentNftOrb.tsx')
  const wall = frontend('command-center/CommandWall.tsx')
  const dashboard = frontend('command-center/DashboardSource.tsx')
  const page = frontend('pages/CommandCenterPage.tsx')
  assert.doesNotMatch(tape, /setInterval\(|paperTapeLine\(|sync pulse…/)
  assert.doesNotMatch(orb, /xartists-holo-scan|a\.pulse|clone armé/)
  assert.doesNotMatch(wall, /bars\.map|Profil volume \(proxy\)|APR est\./)
  assert.doesNotMatch(dashboard, /BULLISH|BEARISH/)
  assert.doesNotMatch(page, /ROOM_WALL|ambientSnap|wallCfg/)
  assert.match(wall, /Aucune mesure certifiée/)
})

test('light loads before React and keeps the dark-mode choice', () => {
  const page = html()
  const state = frontend('experience/state.tsx')
  const css = frontend('experience/public-finish.css')
  assert.match(page, /<html lang="fr" data-theme="light">/)
  assert.match(page, /localStorage\.getItem\("xa-theme"\) === "dark" \? "dark" : "light"/)
  assert.match(page, /Prevent a light\/dark flash/)
  assert.match(page, /html\[data-theme="dark"\] body \{ background: #10120f/)
  assert.match(state, /classList\.toggle\('dark',theme==='dark'\)/)
  assert.match(state, /xa-theme-ready/)
  assert.match(css, /html\[data-theme="light"\] \.xa-first-hero/)
  assert.match(css, /prefers-reduced-motion: reduce/)
})
