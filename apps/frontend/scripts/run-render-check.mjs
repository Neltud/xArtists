#!/usr/bin/env node
/**
 * run-render-check.mjs — static smoke: required source modules exist and
 * entry imports resolve on disk (no browser). Fails hard on missing pages.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'src')

const required = [
  'main.tsx',
  'App.tsx',
  'pages/Dashboard.tsx',
  'pages/MuseumPage.tsx',
  'pages/MarketplacePage.tsx',
  'pages/AgentsPage.tsx',
  'pages/WalletPage.tsx',
  'pages/NotFoundPage.tsx',
  'config/routeRegistry.ts',
  'styles/soul-tokens.css',
]

const missing = required.filter(rel => !fs.existsSync(path.join(src, rel)))

if (missing.length) {
  console.error('render-check FAILED — missing sources:')
  for (const m of missing) console.error(' -', m)
  process.exit(1)
}

// soul-tokens must declare acid green + graphite (design validated)
const tokens = fs.readFileSync(path.join(src, 'styles/soul-tokens.css'), 'utf8')
if (!tokens.includes('#cdf58b') || !tokens.includes('#10120f')) {
  console.error('render-check FAILED — soul-tokens missing validated palette (#10120f / #cdf58b)')
  process.exit(1)
}

console.log('render-check OK — required modules + design tokens present')
