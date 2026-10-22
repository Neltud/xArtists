import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Window } from 'happy-dom'
import { loadSource } from './load-source.mjs'

test('museum fullscreen moves the same scene and canvas into the body and back', async () => {
  const window = new Window({ url: 'https://neltud.github.io/xArtists/' })
  for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Node']) {
    Object.defineProperty(globalThis, key, { value: key === 'window' ? window : window[key], configurable: true })
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const React = await import('react')
  const { createRoot } = await import('react-dom/client')
  const { default: Portal } = loadSource('src/components/museum/MuseumStagePortal.tsx')
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  let mounts = 0
  function Scene() {
    React.useEffect(() => { mounts++ }, [])
    return React.createElement('canvas', { 'data-scene': 'museum' })
  }
  const render = async fullscreen => React.act(async () => root.render(
    React.createElement(Portal, { fullscreen }, React.createElement(Scene)),
  ))
  try {
    await render(false)
    const canvas = document.querySelector('canvas')
    assert(host.contains(canvas))
    await render(true)
    assert.equal(document.querySelector('canvas'), canvas)
    assert(document.body.contains(canvas))
    assert(!host.contains(canvas))
    await render(false)
    assert.equal(document.querySelector('canvas'), canvas)
    assert(host.contains(canvas))
    assert.equal(mounts, 1)
  } finally {
    await React.act(async () => root.unmount())
    assert.equal(document.querySelector('canvas'), null)
    await window.happyDOM.close()
  }
})
