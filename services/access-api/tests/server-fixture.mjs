import { spawn } from 'node:child_process'
import { once } from 'node:events'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export async function startServer(extraEnv = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'access-http-'))
  const child = spawn(process.execPath, [new URL('../src/server.mjs', import.meta.url).pathname], {
    env: { ...process.env, PORT: '0', CORS_ORIGIN: 'https://neltud.github.io',
      MOONPAY_PUBLIC_KEY: '', MOONPAY_SECRET_KEY: '', STRIPE_SECRET_KEY: '',
      ACCESS_JWT_SECRET: '', JWT_SECRET: '', REQUIRE_SIWX: '1',
      PAYBOX_SITE: '', PAYBOX_RANG: '', PAYBOX_HMAC_KEY: '', PAYBOX_IDENTIFIANT: '',
      PAYBOX_ID: '', PAYBOX_ENV: 'preprod', PAYBOX_PUBKEY_PEM: '', PAYBOX_PUBKEY_PATH: '',
      PAYBOX_ORDERS_PATH: path.join(directory, 'orders.json'), PAYBOX_ARTIST_ALLOWLIST: '',
      PULSE_ALLOWLIST: '', PULSE_COLLECTION: '', PULSE_COLLECTIONS: '', ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const port = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { child.kill(); reject(new Error('server_start_timeout')) }, 5000)
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`server_exit_${code}`)) })
    child.stdout.on('data', chunk => {
      const match = chunk.toString().match(/access-api :(\d+)/)
      if (match) { clearTimeout(timeout); resolve(Number(match[1])) }
    })
  })
  return { base: `http://127.0.0.1:${port}`, async close() {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit'); child.kill(); await exited
    }
    fs.rmSync(directory, { recursive: true, force: true })
  } }
}

export const post = (url, body, headers = {}) => fetch(url, {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
})
