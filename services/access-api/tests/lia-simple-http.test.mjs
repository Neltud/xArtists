import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { signJwt } from '../src/verifyAccess.mjs'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..')
const wallet = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'
const secret = 'local-ci-test-secret-not-used-in-real-credentials-12345'
const origin = 'https://neltud.github.io'
let child, base

function token(walletProofVerified) {
  const now = Math.floor(Date.now() / 1000)
  return signJwt({
    sub: wallet, iss: 'xartists-access-api', wallet_proof_verified: walletProofVerified,
    iat: now, exp: now + 120, level: 'SAMPLE',
  }, secret)
}
async function post(body, jwt, requestOrigin = origin) {
  const headers = { 'Content-Type': 'application/json', Origin: requestOrigin }
  if (jwt) headers.Authorization = 'Bearer ' + jwt
  const response = await fetch(base + '/api/lia/intent', {
    method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(3000),
  })
  return { status: response.status, data: await response.json() }
}
const intent = () => ({ type: 'BUY_PACK', packTier: 'pulse', amountEur: '110', userAddress: wallet })

test.before(async () => {
  child = spawn(process.execPath, ['src/server.mjs'], {
    cwd: dir, stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env, PORT: '0', ACCESS_JWT_SECRET: secret,
      REQUIRE_SIWX: '1', EGLD_EUR_RATE: '10',
      LIA_LIVE_TRADING: '0', PAYBOX_CHECKOUT_ENABLED: '0',
      MINT_LIVE_ENABLED: 'false', CORS_ORIGIN: origin,
      NODE_ENV: 'test',
    },
  })
  const port = await new Promise((resolve, reject) => {
    let accumulated = ''
    const timeout = setTimeout(() => reject(new Error('server_listen_timeout:' + accumulated)), 9000)
    child.stdout.on('data', chunk => {
      accumulated += chunk.toString()
      const match = accumulated.match(/access-api :(\d+)\b/)
      if (match) { clearTimeout(timeout); resolve(match[1]) }
    })
    child.on('error', err => { clearTimeout(timeout); reject(err) })
    child.on('exit', code => { clearTimeout(timeout); reject(new Error('server_exited:' + code + ':' + accumulated)) })
  })
  base = 'http://127.0.0.1:' + port
})
test.after(() => { if (child && child.exitCode === null) child.kill('SIGTERM') })

test('HTTP structured paper API rejects unauthenticated or old unsigned-access JWT', async () => {
  const body = { action: 'prepare', intent: intent() }
  assert.equal((await post(body, null)).status, 401)
  assert.equal((await post(body, token(false))).status, 401)
  assert.equal((await post(body, token(true), 'https://unauthorized.example')).status, 403)
})

test('HTTP refuses live mode, unknown fields and foreign actors', async () => {
  const jwt = token(true)
  const foreign = await post({ action: 'prepare', intent: { ...intent(), userAddress: 'erd1qqqqqqqqqqqqqpgq4mdf8u7y0luq8x6qtzk66g0a77sf9nt9t0fqca9jh7' } }, jwt)
  assert.equal(foreign.status, 400)
  assert.equal((await post({ action: 'prepare', intent: { ...intent(), paperMode: false } }, jwt)).status, 400)
  assert.equal((await post({ action: 'prepare', intent: intent(), executeLive: true }, jwt)).status, 400)
})

test('HTTP prepare then confirm yields nonpayment paper receipt; replay is idempotent', async () => {
  const jwt = token(true)
  const prepared = await post({ action: 'prepare', intent: intent() }, jwt)
  assert.equal(prepared.status, 200)
  assert.equal(prepared.data.status, 'ready')
  assert.equal(prepared.data.mode, 'paper')
  assert.equal(prepared.data.quote.amountCents, 11000)
  assert.equal(prepared.data.quote.payable, false)
  const confirmationId = prepared.data.confirmationId
  const confirmed = await post({ action: 'confirm', confirmationId }, jwt)
  assert.equal(confirmed.status, 200)
  assert.equal(confirmed.data.status, 'paper_success')
  assert.equal(confirmed.data.paymentVerified, false)
  assert.equal(confirmed.data.nftMinted, false)
  assert.equal(confirmed.data.txHash, null)
  assert.equal(confirmed.data.amountChargedCents, 0)
  const replay = await post({ action: 'confirm', confirmationId }, jwt)
  assert.equal(replay.status, 200)
  assert.equal(replay.data.auditId, confirmed.data.auditId)
  assert.equal(replay.data.replayed, true)
})

test('HTTP cancel prevents confirmation; wrong HTTP method fails', async () => {
  const jwt = token(true)
  const before = await post({ action: 'prepare', intent: intent() }, jwt)
  assert.equal(before.status, 200)
  const confirmationId = before.data.confirmationId
  assert.equal((await post({ action: 'cancel', confirmationId }, jwt)).data.status, 'cancelled')
  assert.equal((await post({ action: 'confirm', confirmationId }, jwt)).status, 409)
  const read = await fetch(base + '/api/lia/intent', { headers: { Origin: origin } })
  assert.equal(read.status, 405)
})
