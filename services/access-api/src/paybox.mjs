/**
 * Paybox System (Verifone) — e-Transactions carte FR.
 *
 * Offre: Paybox System TPE web — manuel d'integration v8.3 (2025-09).
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
 * Business fields (ref, amount, error) derived ONLY from authenticated signed payload.
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
  // Entities built at runtime so source never embeds literal XML entities (pipeline-safe)
  const AMP = String.fromCharCode(38) + 'amp;'
  const LT = String.fromCharCode(38) + 'lt;'
  const GT = String.fromCharCode(38) + 'gt;'
  const QUOT = String.fromCharCode(38) + 'quot;'
  const APOS = String.fromCharCode(38) + 'apos;'
  return String(s)
    .replace(/&/g, AMP)
    .replace(/</g, LT)
    .replace(/>/g, GT)
    .replace(/"/g, QUOT)
    .replace(/'/g, APOS)
}

/** Exported for unit tests (3DSv2 billing / shopping cart safety). */
export { escapeXml as _escapeXmlForTests }

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

/**
 * Parse business fields ONLY from authenticated signed payload.
 * Never trust merged query/body params for ref/amount/error after verification.
 */
export function parseSignedIpnFields(dataString) {
  if (!dataString || typeof dataString !== 'string') return null
  const map = Object.fromEntries(new URLSearchParams(dataString))
  const amount = map.amount ?? map.M ?? map.PBX_TOTAL
  const ref = map.ref ?? map.R ?? map.PBX_CMD
  const error = map.error ?? map.E ?? map.Erreur
  const auto = map.auto ?? map.A
  const idtrans = map.idtrans ?? map.S ?? map.trans
  if (amount === undefined || ref === undefined || error === undefined) return null
  const pairs = dataString.split('&').filter(Boolean).map(p => {
    const i = p.indexOf('=')
    return i < 0 ? [p, ''] : [p.slice(0, i), p.slice(i + 1)]
  })
  const seen = new Map()
  for (const [k, v] of pairs) {
    const canon = ({ M: 'amount', R: 'ref', A: 'auto', E: 'error', S: 'idtrans',
      PBX_TOTAL: 'amount', PBX_CMD: 'ref', Erreur: 'error', trans: 'idtrans' })[k] || k
    if (seen.has(canon) && seen.get(canon) !== v) return null
    seen.set(canon, v)
  }
  const amountInt = Number.parseInt(String(amount), 10)
  if (!Number.isInteger(amountInt) || amountInt <= 0) return null
  if (!String(ref).trim()) return null
  return {
    amount_cents: amountInt,
    ref: String(ref),
    error: String(error),
    authorization: auto != null && auto !== '' ? String(auto) : null,
    provider_tx_id: idtrans != null && idtrans !== '' ? String(idtrans) : null,
  }
}

/**
 * Prefer a single authenticated source for IPN.
 * Rejects simultaneous non-empty query and body.
 */
export function resolveIpnAuthenticatedSource(queryRaw, bodyRaw) {
  if (queryRaw && bodyRaw) return { ok: false, reason: 'ambiguous_signed_sources' }
  const raw = bodyRaw || queryRaw || ''
  const rawSignedData = extractRawSignedData(raw)
  if (!rawSignedData) return { ok: false, reason: 'missing_or_ambiguous_signed_payload' }
  const last = raw.slice(raw.lastIndexOf('&') + 1)
  return { ok: true, rawSignedData, sign: last.slice(last.indexOf('=') + 1) }
}

export function verifyPayboxIpn(params, expectedAmountCents, merchant = {}, opts = {}) {
  const sign = String(opts.sign || params.sign || params.K || '')
  if (!sign) return { ok: false, reason: 'missing_signature' }

  let dataString = opts.rawSignedData
  if (!dataString) {
    if (opts.allowUnsignedReconstruction !== true || !opts.pubKey) {
      return { ok: false, reason: 'missing_signed_payload' }
    }
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
    return { ok: false, reason: 'bad_signature' }
  }

  const fields = parseSignedIpnFields(dataString)
  if (!fields) return { ok: false, reason: 'signed_fields_unparseable_or_ambiguous' }

  if (expectedAmountCents !== undefined && fields.amount_cents !== expectedAmountCents) {
    return { ok: false, reason: 'amount_mismatch', expected: expectedAmountCents, got: fields.amount_cents }
  }

  const map = Object.fromEntries(new URLSearchParams(dataString))
  if (merchant.site && map.site && String(map.site) !== String(merchant.site)) {
    return { ok: false, reason: 'merchant_mismatch' }
  }
  if (merchant.devise && map.devise && String(map.devise) !== String(merchant.devise)) {
    return { ok: false, reason: 'currency_mismatch' }
  }

  return {
    ok: true,
    ref: fields.ref,
    amount_cents: fields.amount_cents,
    error: fields.error,
    authorization: fields.authorization,
    provider_tx_id: fields.provider_tx_id,
    paid: fields.error === '00000',
    source: 'signed_payload',
  }
}
