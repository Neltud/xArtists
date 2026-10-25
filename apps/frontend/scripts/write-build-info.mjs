import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const sha = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const release = JSON.parse(readFileSync('dist/dapp-release.json', 'utf8'))
if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Cannot identify the source commit')
writeFileSync('dist/build-info.json', JSON.stringify({
  schema_version: 1,
  renderer: 'sites-v3',
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
