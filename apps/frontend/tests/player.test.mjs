import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Window } from 'happy-dom'
import { loadSource } from './load-source.mjs'

test('hide/show keeps the exact YouTube iframe and URL; Stop removes it', async () => {
  const window = new Window({ url: 'https://neltud.github.io/xArtists/', settings: {
    disableIframePageLoading: true, disableCSSFileLoading: true, disableJavaScriptFileLoading: true,
  } })
  for (const key of ['window', 'document', 'localStorage', 'navigator', 'HTMLElement', 'Event', 'CustomEvent', 'KeyboardEvent', 'MouseEvent', 'Node']) {
    Object.defineProperty(globalThis, key, { value: key === 'window' ? window : window[key], configurable: true })
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const React = await import('react')
  const { createRoot } = await import('react-dom/client')
  const { default: Player } = loadSource('src/components/PlaylistPlayerModal.tsx')
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  const frame = () => document.querySelector('iframe')
  const button = label => [...document.querySelectorAll('button')].find(el => el.textContent.trim() === label)
  const click = async element => {
    assert(element)
    await React.act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true })))
  }
  try {
    await React.act(async () => root.render(React.createElement(Player)))
    assert.equal(frame(), null)
    await click(document.querySelector('.music-player-toggle'))
    const iframe = frame()
    const source = iframe.src
    assert.equal(new URL(source).searchParams.get('list'), 'PLgOJTjzDs6ePLXPNu0YE1w-R-iJneJzF3')
    assert.equal(iframe.referrerPolicy, 'strict-origin-when-cross-origin')
    assert.equal(document.body.style.overflow, 'hidden')
    await click(button('Cacher le lecteur'))
    assert.equal(frame(), iframe)
    assert.equal(iframe.src, source)
    assert.equal(localStorage.getItem('xartists-music-enabled'), '1')
    assert.equal(document.querySelector('.music-player-background').getAttribute('aria-hidden'), 'true')
    assert.equal(iframe.tabIndex, -1)
    assert.equal(document.body.style.overflow, '')
    await click(document.querySelector('.music-player-toggle'))
    assert.equal(frame(), iframe)
    await React.act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    assert.equal(frame(), iframe)
    assert(document.querySelector('.music-player-background'))
    await React.act(async () => window.dispatchEvent(new CustomEvent('xartists-playlist-modal', { detail: { open: true } })))
    assert.equal(frame(), iframe)
    await React.act(async () => window.dispatchEvent(new CustomEvent('xartists-playlist-modal', { detail: { open: false } })))
    assert.equal(frame(), iframe)
    await click(document.querySelector('.music-player-toggle'))
    await click(button('Arrêter la musique'))
    assert.equal(frame(), null)
    assert.equal(localStorage.getItem('xartists-music-enabled'), '0')
  } finally {
    await React.act(async () => root.unmount())
    await window.happyDOM.close()
  }
})
