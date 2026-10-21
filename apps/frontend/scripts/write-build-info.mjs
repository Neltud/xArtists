import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const sha = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const info = {
  schema_version: 1,
  renderer: 'sites-v3',
  source_sha: sha,
  presentation_source_sha: process.env.VITE_PRESENTATION_SHA || null,
  base_url: '/xArtists/',
  built_at: new Date().toISOString(),
  workflow_run_url:
    process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null,
  app_build: process.env.VITE_APP_BUILD || 'sites-v3-release',
}

writeFileSync('dist/build-info.json', JSON.stringify(info, null, 2) + '\n')
console.log('build-info', info.source_sha)
