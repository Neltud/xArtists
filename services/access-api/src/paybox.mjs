/**
 * Paybox System (Verifone) — e-Transactions carte FR.
 *
 * Offre: Paybox System TPE web — manuel d'intégration v8.3 (2025-09).
 * NOT paybox.sh agent API.
 *
 * Outbound: HMAC-SHA512 (PBX_HMAC).
 * Inbound IPN: RSA SHA-256 withRSA, key size 2048 only.
 *   PBX_IPNALGOSIGN=SHA_256, PBX_SIGN_KEYSIZE=2048 — no SHA-1 / RSA-1024 fallback.
 *   Official pubkey: https://www.paybox.com/wp-content/uploads/2025/09/pubkey_RSA_2048.pem
 *   Bundled: paybox_pubkey_rsa2048.pem
 *   DER SHA-256: f4926805a6b5294a3b4523f260c51c412617d774e2a4ef27c4ec0eb85ecb93d6
 *
 * IPN signature verified over raw query with sign stripped (extractRawSignedData).
 * PBX_RETOUR ends with sign:K. 3DSv2: PBX_BILLING + PBX_SHOPPINGCART.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const TPE = {
  preprod: 'https://preprod-tpeweb.paybox.com/cgi/MYchoix_pagepaiement.cgi',
  prod: 'https://tpeweb.paybox.com/cgi/MYchoix_pagepaiement.cgi',
}

export const IPN_POLICY = Object.freeze({
  algorithm: 'SHA_256',
  keySize: 2048,
  opensslDigest: 'RSA-SHA256',
  expectedSigBytes: 256,
  pubkeyFile: 'paybox_pubkey_rsa2048.pem',
  pubkeyUrl: 'https://www.paybox.com/wp-content/uploads/2025/09/pubkey_RSA_2048.pem',
  pubkeySha256: 'f4926805a6b5294a3b4523f260c51c412617d774e2a4ef27c4ec0eb85ecb93d6',
})

export function payboxConfig(env = process.env) {
  const site = String(env.PAYBOX_SITE || '').trim()
  const rang = String(env.PAYBOX_RANG || '').trim()
  const hmacKey = String(env.PAYBOX_HMAC_KEY || '').trim()
  const identifiant = String(env.PAYBOX_IDENTIFIANT || env.PAYBOX_ID || '').trim()
  const mode = String(env.PAYBOX_ENV || 'preprod').toLowerCase() === 'prod' ? 'prod' : 'preprod'
  const devise = String(env.PAYBOX_DEVISE || '978').trim()
  const ready = Boolean(site && rang && hmacKey && hmacKey.length >= 16)
  return { ready, site, rang, identifiant, hmacKey, mode, devise, endpoint: TPE[mode] }
}

export function signPayboxHmac(message, hmacKeyHex) {
  const key = Buffer.from(String(hmacKeyHex).replace(/\s+/g, ''), 'hex')
  if (key.length < 8) {
    const err = new Error('paybox_hmac_key_invalid')
    err.statusCode = 503
    throw err
  }
  return crypto.createHmac('sha512', key).update(message, 'utf8').digest('hex').toUpperCase()
}

export function buildHmacMessage(fields) {
  const order = [
    'PBX_SITE', 'PBX_RANG', 'PBX_IDENTIFIANT', 'PBX_TOTAL', 'PBX_DEVISE', 'PBX_CMD',
    'PBX_PORTEUR', 'PBX_RETOUR', 'PBX_HASH', 'PBX_TIME', 'PBX_EFFECTUE', 'PBX_ANNULE',
    'PBX_REFUSE', 'PBX_ATTENTE', 'PBX_REPONDRE_A', 'PBX_SHOPPINGCART', 'PBX_BILLING',
    'PBX_IPNALGOSIGN', 'PBX_SIGN_KEYSIZE',
  ]
  const parts = []
  for (const k of order) {
    if (fields[k] === undefined || fields[k] === null || fields[k] === '') continue
    parts.push(`${k}=${fields[k]}`)
  }
  return parts.join('&')
}

export function buildShoppingCartXml(totalCents, quantity = 1) {
  return `<?xml version="1.0" encoding="utf-8"?><shoppingcart><total><totalQuantity>${quantity}</totalQuantity></total></shoppingcart>`
}

function escapeXml(s) {
  return String(s).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"')
}

export function buildBillingXml(opts = {}) {
  const first = opts.firstName || 'Client'
  const last = opts.lastName || 'XArtists'
  const addr = opts.address || '1 rue de la Paix'
  const zip = opts.zip || '75001'
  const city = opts.city || 'Paris'
  const country = opts.countryCode || '250'
  return `<?xml version="1.0" encoding="utf-8"?><Billing><Address><FirstName>${escapeXml(first)}</FirstName><LastName>${escapeXml(last)}</LastName><Address1>${escapeXml(addr)}</Address1><ZipCode>${escapeXml(zip)}</ZipCode><City>${escapeXml(city)}</City><CountryCode>${escapeXml(country)}</CountryCode></Address></Billing>`
}

function assertKey2048(key) {
  const bits = key.asymmetricKeyDetails?.modulusLength
  if (bits && bits !== 2048) {
    const err = new Error(`paybox_pubkey_must_be_2048_got_${bits}`)
    err.code = 'KEY_SIZE'
    err.statusCode = 503
    throw err
  }
}

export function loadPayboxPublicKey2048(env = process.env) {
  if (env.PAYBOX_PUBKEY_PEM) {
    const key = crypto.createPublicKey(env.PAYBOX_PUBKEY_PEM)
    assertKey2048(key)
    return key
  }
  const candidates = [
    env.PAYBOX_PUBKEY_PATH,
    path.join(__dirname, 'paybox_pubkey_rsa2048.pem'),
    path.join(__dirname, '../paybox_pubkey_rsa2048.pem'),
  ].filter(Boolean)
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const key = crypto.createPublicKey(fs.readFileSync(p, 'utf8'))
        assertKey2048(key)
        return key
      }
    } catch (e) {
      if (e.code === 'KEY_SIZE') throw e
    }
  }
  throw Object.assign(new Error('paybox_pubkey_2048_missing'), { statusCode: 503 })
}

export function verifyPayboxRsaSignature(dataString, signatureB64, pubKey = loadPayboxPublicKey2048()) {
  if (!dataString || !signatureB64) return false
  let sigRaw = String(signatureB64)
  if (/%[0-9A-Fa-f]{2}/.test(sigRaw)) {
    try { sigRaw = decodeURIComponent(sigRaw) } catch { /* */ }
  }
  let sigBuf
  try { sigBuf = Buffer.from(sigRaw, 'base64') } catch { return false }
  if (sigBuf.length !== IPN_POLICY.expectedSigBytes) return false
  try {
    const verifier = crypto.createVerify(IPN_POLICY.opensslDigest)
    verifier.update(Buffer.from(dataString, 'utf8'))
    verifier.end()
    return verifier.verify({ key: pubKey, padding: crypto.constants.RSA_PKCS1_PADDING }, sigBuf)
  } catch { return false }
}

export function createPayboxSession(input, cfg = payboxConfig()) {
  if (!cfg.ready) {
    const err = new Error('paybox_not_configured')
    err.statusCode = 501
    throw err
  }
  const amount = Number(input.pack.price_cents)
  if (!Number.isInteger(amount) || amount <= 0) {
    const err = new Error('invalid_server_amount')
    err.statusCode = 500
    throw err
  }
  const orderId = String(input.orderId || '').slice(0, 30)
  if (!orderId) {
    const err = new Error('missing_order_id')
    err.statusCode = 500
    throw err
  }
  const time = new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00')
  const retour = 'amount:M;ref:R;auto:A;error:E;idtrans:S;sign:K'
  const fields = {
    PBX_SITE: cfg.site,
    PBX_RANG: cfg.rang,
    PBX_TOTAL: String(amount),
    PBX_DEVISE: cfg.devise,
    PBX_CMD: orderId,
    PBX_PORTEUR: input.email || 'noreply@xartists.invalid',
    PBX_RETOUR: retour,
    PBX_HASH: 'SHA512',
    PBX_TIME: time,
    PBX_EFFECTUE: input.successUrl,
    PBX_ANNULE: input.cancelUrl,
    PBX_REFUSE: input.cancelUrl,
    PBX_REPONDRE_A: input.ipnUrl,
    PBX_SHOPPINGCART: buildShoppingCartXml(amount),
    PBX_BILLING: buildBillingXml(input.billing || {}),
    PBX_IPNALGOSIGN: IPN_POLICY.algorithm,
    PBX_SIGN_KEYSIZE: String(IPN_POLICY.keySize),
  }
  if (cfg.identifiant) fields.PBX_IDENTIFIANT = cfg.identifiant
  fields.PBX_HMAC = signPayboxHmac(buildHmacMessage(fields), cfg.hmacKey)
  return {
    ok: true, url: cfg.endpoint, method: 'POST', fields, order_id: orderId,
    amount_cents: amount, currency: 'EUR', delivery: 'ipn_only',
    auth_outbound: 'hmac_sha512', auth_inbound: 'rsa_sha256_2048',
    ipn_policy: { ...IPN_POLICY },
  }
}

export function extractRawSignedData(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') return null
  const m = rawQuery.match(/^(.*)(?:&sign=|&K=)([^&]*)$/i)
  if (!m) return null
  return m[1]
}

export function verifyPayboxIpn(params, expectedAmountCents, merchant = {}, opts = {}) {
  const amount = String(params.amount || params.M || params.PBX_TOTAL || '')
  const ref = String(params.ref || params.R || params.PBX_CMD || '')
  const error = String(params.error || params.E || params.Erreur || '')
  const auto = String(params.auto || params.A || '')
  const idtrans = String(params.idtrans || params.S || params.trans || '')
  const sign = String(params.sign || params.K || '')
  if (!ref) return { ok: false, reason: 'missing_ref' }
  if (!sign) return { ok: false, reason: 'missing_signature' }
  const amountInt = Number.parseInt(amount, 10)
  if (!Number.isInteger(amountInt) || amountInt !== Number(expectedAmountCents)) {
    return { ok: false, reason: 'amount_mismatch', expected: expectedAmountCents, got: amountInt }
  }
  const siteEcho = params.site || params.PBX_SITE
  if (merchant.site && siteEcho && String(siteEcho) !== String(merchant.site)) {
    return { ok: false, reason: 'merchant_mismatch' }
  }
  const deviseEcho = params.devise || params.PBX_DEVISE
  if (merchant.devise && deviseEcho && String(deviseEcho) !== String(merchant.devise)) {
    return { ok: false, reason: 'currency_mismatch' }
  }
  let dataString = opts.rawSignedData
  if (!dataString) {
    dataString = ['amount', 'ref', 'auto', 'error', 'idtrans']
      .map(k => {
        const v = params[k] ?? params[{ amount: 'M', ref: 'R', auto: 'A', error: 'E', idtrans: 'S' }[k]] ?? ''
        return `${k}=${v}`
      })
      .join('&')
  }
  let pubKey = opts.pubKey
  try {
    if (!pubKey) pubKey = loadPayboxPublicKey2048()
  } catch (e) {
    return { ok: false, reason: e.message || 'pubkey_unavailable' }
  }
  if (!verifyPayboxRsaSignature(dataString, sign, pubKey)) {
    return { ok: false, reason: 'bad_signature', ref }
  }
  return {
    ok: true, ref, amount_cents: amountInt, error,
    authorization: auto || null, provider_tx_id: idtrans || null, paid: error === '00000',
  }
}
