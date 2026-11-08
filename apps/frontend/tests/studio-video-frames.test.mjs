import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { transform } from 'esbuild'

const moduleSource = readFileSync(new URL('../src/lib/studioVideoFrames.ts', import.meta.url), 'utf8')
const studioSource = readFileSync(new URL('../src/components/ArtworkTurntableLab.tsx', import.meta.url), 'utf8')
const transformed = await transform(moduleSource, { loader: 'ts', format: 'esm', target: 'es2022' })
const module = await import('data:text/javascript;base64,' + Buffer.from(transformed.code).toString('base64'))
const { sampleFrameTimes, STUDIO_VIDEO_MAX_BYTES, STUDIO_VIDEO_FRAME_COUNTS } = module

test('samples N unique, monotonic timestamps strictly inside selected clip', () => {
  const stamps = sampleFrameTimes(3.2, 23.2, 16)
  assert.equal(stamps.length, 16)
  assert.ok(stamps[0] > 3.2)
  assert.ok(stamps.at(-1) < 23.2)
  for (let index = 1; index < stamps.length; index++) {
    assert.ok(stamps[index] > stamps[index - 1])
  }
  assert.ok(Math.abs(stamps[0] - 3.825) < 1e-9)
  assert.ok(Math.abs(stamps.at(-1) - 22.575) < 1e-9)
})

test('rejects impossible clips and unsafe frame counts', () => {
  for (const [a, b, n] of [
    [-1, 3, 8], [2, 2, 8], [2, 2.1, 8], [0, 1, 3], [0, 1, 37],
    [Number.NaN, 2, 16], [0, Number.POSITIVE_INFINITY, 16],
  ]) {
    assert.throws(() => sampleFrameTimes(a, b, n))
  }
})

test('browser sampler has a bounded scope and fail-closed cancellation', () => {
  assert.equal(STUDIO_VIDEO_MAX_BYTES, 120 * 1024 * 1024)
  assert.deepEqual(STUDIO_VIDEO_FRAME_COUNTS, [8, 12, 16, 24, 36])
  assert.match(moduleSource, /URL\.revokeObjectURL\(url\)/)
  assert.match(moduleSource, /signal\.addEventListener\('abort'/)
  assert.match(moduleSource, /video\.currentTime =/)
  assert.match(moduleSource, /canvas\.toBlob\(/)
  assert.match(moduleSource, /video\.videoWidth/)
  assert.match(moduleSource, /video\.duration/)
  assert.match(moduleSource, /codec HEVC\/H\.265 possible/)
  assert.doesNotMatch(moduleSource, /\bfetch\s*\(/)
})

test('Studio exposes clipping, frame count, progress and cancellation UI', () => {
  assert.match(studioSource, /inspectLocalMp4/)
  assert.match(studioSource, /extractLocalMp4Frames/)
  assert.match(studioSource, /clipStart/)
  assert.match(studioSource, /clipEnd/)
  assert.match(studioSource, /STUDIO_VIDEO_FRAME_COUNTS/)
  assert.match(studioSource, /activeJobRef\.current\?\.abort\(\)/)
  assert.match(studioSource, /role="status" aria-live="polite"/)
  assert.match(studioSource, /angles affichés sont indicatifs/)
  assert.doesNotMatch(studioSource, /\bfetch\s*\(/)
})
