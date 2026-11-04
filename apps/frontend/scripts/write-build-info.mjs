import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const sha = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const release = JSON.parse(readFileSync('dist/dapp-release.json', 'utf8'))
// The root Release Please manifest is the version source of truth.
// apps/frontend/package.json tracks the frontend package lifecycle separately.
const releaseManifest = JSON.parse(readFileSync('../../.release-please-manifest.json', 'utf8'))
const releaseVersion = releaseManifest['.']
if (typeof releaseVersion !== 'string' || !/^\\d+\\.\\d+\\.\\d+$/.test(releaseVersion)) {
  throw new Error('Invalid root Release Please version')
}
if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Cannot identify the source commit')
writeFileSync('dist/build-info.json', JSON.stringify({
  schema_version: 1,
  renderer: 'sites-v3',
  release_version: releaseVersion,
  version_source: '.release-please-manifest.json',
  source_sha: sha,
  presentation_source_sha: '8a607c8831234fe738a091a5a4caf325811c1b5b',
  base_url: '/xArtists/',
  lia_live_trading: release.lia_live_trading,
  public_route_count: release.routes.length,
  built_at: new Date().toISOString(),
  workflow_run_url: process.env.GITHUB_RUN_ID
    ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null,
}, null, 2) + '\n')
