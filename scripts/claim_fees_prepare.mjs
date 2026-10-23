/**
 * Only entrypoint that may prepare a claimFees payload for review.
 * Always runs claim_fees_guard first. Never broadcasts.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const guard = path.join(dir, 'claim_fees_guard.mjs')
const r = spawnSync(process.execPath, [guard], { env: process.env, encoding: 'utf8' })
process.stdout.write(r.stdout || '')
process.stderr.write(r.stderr || '')
if (r.status !== 0) process.exit(r.status || 1)

console.log(JSON.stringify({
  ok: true,
  prepared: false,
  broadcast: false,
  reason: 'claimFees_prepare_requires_offline_ops_review',
  next: 'manual PEM sign outside CI only after dual review',
}))
