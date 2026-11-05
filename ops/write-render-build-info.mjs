/**
 * Stamp the already-built Render frontend at container startup.
 * Render exposes RENDER_GIT_COMMIT at runtime (no Git checkout in the image).
 * This is a build identity, NOT a payment/delivery or site availability claim.
 * Missing or invalid metadata must leave build-info.json absent (HTTP 404).
 */
import { readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export const RENDER_PUBLIC_ROOT = '/usr/share/nginx/html/xArtists'

export function createRenderBuildInfo({ commit, release, stampedAt = new Date().toISOString() }) {
  if (!/^[0-9a-f]{40}$/.test(String(commit || ''))) {
    throw new Error('missing_or_invalid_render_commit')
  }
  if (
    !release || release.schema_version !== 1 || release.base_path !== '/xArtists/' ||
    typeof release.lia_live_trading !== 'boolean' ||
    !Array.isArray(release.routes) || release.routes.length === 0 ||
    release.routes.some(route => typeof route !== 'string' || !/^\/(?:[a-z0-9_-]+\/?)*$/i.test(route))
  ) {
    throw new Error('invalid_frontend_release_manifest')
  }
  if (!Number.isFinite(Date.parse(stampedAt))) throw new Error('invalid_stamp_time')
  return {
    schema_version: 1,
    renderer: 'sites-v3',
    source_sha: commit,
    base_url: '/xArtists/',
    lia_live_trading: release.lia_live_trading,
    public_route_count: release.routes.length,
    stamped_at: stampedAt,
    stamp_source: 'render-runtime',
    // No built_at: a container restart is NOT the build timestamp.
  }
}

export function writeRenderBuildInfo({ commit, root = RENDER_PUBLIC_ROOT, stampedAt } = {}) {
  const release = JSON.parse(readFileSync(join(root, 'dapp-release.json'), 'utf8'))
  const payload = createRenderBuildInfo({ commit, release, stampedAt })
  const destination = join(root, 'build-info.json')
  const temporary = join(root, `.build-info.${process.pid}.tmp`)
  try {
    writeFileSync(temporary, JSON.stringify(payload, null, 2) + '\n', { encoding: 'utf8', flag: 'wx', mode: 0o644 })
    renameSync(temporary, destination)
  } finally {
    rmSync(temporary, { force: true })
  }
  return payload
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    writeRenderBuildInfo({ commit: process.env.RENDER_GIT_COMMIT })
  } catch {
    // No credentials, internal paths or raw errors in a public or shared log.
    console.error('render_public_build_stamp_unavailable')
    process.exitCode = 1
  }
}
