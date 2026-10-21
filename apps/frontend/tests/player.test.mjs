import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadSource } from './load-source.mjs'

test('player source keeps single iframe lifecycle for hide vs stop', () => {
  const src = loadSource('src/components/PlaylistPlayerModal.tsx')
  assert.match(src, /Cacher/)
  assert.match(src, /Arr[eê]ter|stop/i)
  assert.match(src, /createPortal|iframe/)
  assert.match(src, /setMusicEnabled\(false\)/)
})

test('buildEmbedSrc supports youtube playlist listType', () => {
  const src = loadSource('src/config/playlist.ts')
  assert.match(src, /listType/)
  assert.match(src, /videoseries|playlist/)
})
