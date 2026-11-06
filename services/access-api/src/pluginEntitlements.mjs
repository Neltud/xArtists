/**
 * Plugin entitlement verification primitives, deliberately not a checkout API.
 * Gate stays OFF by default. Calling code MUST supply an authenticated subject
 * and an authoritative DB row, not browser values or client-provided receipts.
 */
import {createHmac, timingSafeEqual} from 'node:crypto'

export const PLUGIN_ENTITLEMENT_VERSION = 1
const ONE_YEAR_MS = 366 * 86400_000
const ID = /^[a-z][a-z0-9-]{2,63}$/
const IDENTIFIER = /^[A-Za-z0-9:_-]{8,128}$/
const EVENT = /^[A-Za-z0-9:_-]{8,160}$/
const KEYS = ['v','kid','grantId','product','subject','environment','issuerEvent','issuedAt','expiresAt']
const EXACT = values => Object.keys(values).length === KEYS.length && KEYS.every(key => Object.hasOwn(values,key))
const SECURE_ENV = new Set(['sandbox','production'])
const deny = reason => Object.freeze({allowed:false,reason})
const b64 = value => Buffer.from(value).toString('base64url')
const parseB64 = value => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) return null
  const b = Buffer.from(value,'base64url')
  return b64(b) === value ? b : null
}
const secretFor = (secrets, kid) => {
  const v = secrets instanceof Map ? secrets.get(kid) : Object.hasOwn(secrets ?? {},kid) ? secrets[kid] : null
  if (!Buffer.isBuffer(v) && typeof v !== 'string') return null
  const key = Buffer.from(v)
  return key.length >= 32 ? key : null
}
function validGrant(g) {
  return g && typeof g === 'object' && !Array.isArray(g) && EXACT(g) && g.v === PLUGIN_ENTITLEMENT_VERSION &&
    ID.test(g.kid) && ID.test(g.product) && IDENTIFIER.test(g.grantId) && IDENTIFIER.test(g.subject) &&
    SECURE_ENV.has(g.environment) && EVENT.test(g.issuerEvent) &&
    Number.isSafeInteger(g.issuedAt) && Number.isSafeInteger(g.expiresAt) &&
    g.issuedAt > 0 && g.expiresAt > g.issuedAt && g.expiresAt - g.issuedAt <= ONE_YEAR_MS
}

/** Operator-only issuer: must only be called following a signed provider webhook,
 * durable settlement check and unique event reservation in PostgreSQL. */
export function signPluginEntitlement(grant, secret) {
  if (!validGrant(grant)) throw Error('invalid_plugin_grant')
  if (!Buffer.isBuffer(secret) && typeof secret !== 'string') throw Error('invalid_signing_key')
  const key = Buffer.from(secret)
  if (key.length < 32) throw Error('invalid_signing_key')
  const payload = b64(JSON.stringify(KEYS.reduce((acc,k)=>(acc[k]=grant[k],acc),{})))
  const mac = createHmac('sha256',key).update('xartists/plugin-entitlement/v1\n').update(payload).digest()
  return payload+'.'+b64(mac)
}

/** Pure verifier bound to an authenticated session plus a CURRENT database row.
 * No in-memory entitlement or localStorage/browser proof is authoritative.
 * This module does not verify wallet signatures or activate the owner exception. */
export async function checkPluginEntitlement({
  enabled=false, token, product, authenticatedSubject, environment='production',
  secrets={}, lookupGrant, now=Date.now(), ownerWalletText,
}={}) {
  if (!enabled) return deny('disabled')
  if (typeof product !== 'string' || !ID.test(product) || typeof authenticatedSubject !== 'string' ||
      !IDENTIFIER.test(authenticatedSubject) || !SECURE_ENV.has(environment)) return deny('session_required')
  // Deliberately ignore ownerWalletText: merely knowing an admin address is not authentication.
  void ownerWalletText
  if (typeof token !== 'string' || token.length > 4096 || typeof lookupGrant !== 'function') return deny('grant_required')
  const parts = token.split('.')
  if (parts.length !== 2) return deny('invalid_grant')
  const payload = parseB64(parts[0]), signature = parseB64(parts[1])
  if (!payload || payload.length > 2048 || !signature || signature.length !== 32) return deny('invalid_grant')
  let grant
  try { grant = JSON.parse(payload.toString('utf8')) } catch { return deny('invalid_grant') }
  if (!validGrant(grant) || !Number.isSafeInteger(now) || now <= 0) return deny('invalid_grant')
  if (grant.product !== product || grant.subject !== authenticatedSubject || grant.environment !== environment) return deny('grant_mismatch')
  const secret = secretFor(secrets,grant.kid)
  if (!secret) return deny('unknown_issuer')
  const actual = createHmac('sha256',secret).update('xartists/plugin-entitlement/v1\n').update(parts[0]).digest()
  if (!timingSafeEqual(signature,actual)) return deny('invalid_grant')
  if (grant.issuedAt > now + 60_000 || grant.expiresAt <= now) return deny('expired_or_future_grant')
  let record
  try { record = await lookupGrant(grant.grantId) } catch { return deny('grant_store_unavailable') }
  if (!record || record.grantId !== grant.grantId || record.product !== grant.product ||
      record.subject !== grant.subject || record.environment !== grant.environment ||
      record.issuerEvent !== grant.issuerEvent || record.issuedAt !== grant.issuedAt ||
      record.expiresAt !== grant.expiresAt) return deny('grant_not_found')
  if (record.status !== 'active' || record.settlementVerification !== 'verified_provider_event' ||
      record.revokedAt != null || record.refundedAt != null || record.expiresAt <= now) return deny('grant_not_active')
  return Object.freeze({allowed:true,kind:'paid',product:grant.product,expiresAt:grant.expiresAt})
}