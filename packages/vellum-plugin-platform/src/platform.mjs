/**
 * xArtists/Vellum paper-only plugin authorization contracts.
 * In-memory verification and simulated finance ONLY. No remote I/O or signer.
 */
import { createHash, createPublicKey, verify } from 'node:crypto'

const ALL_SCOPES = Object.freeze([
  'read:catalog', 'art:generate:paper', 'orders:prepare:paper',
  'payments:execute', 'nft:mint', 'bridge:submit', 'escrow:release',
])
const PAPER_SCOPES = new Set(['read:catalog', 'art:generate:paper', 'orders:prepare:paper'])
const ID = /^[a-z][a-z0-9.-]{2,63}$/
const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/
const KEY_ID = /^[A-Za-z0-9._:-]{3,80}$/
const RESOURCE = /^[a-z][a-z0-9-]{1,31}:[A-Za-z0-9._-]{1,96}$/
const CONTEXT_ID = /^[A-Za-z0-9._:-]{3,128}$/
const ACTION_ID = /^[A-Za-z0-9._:-]{8,128}$/
const HEX_SIGNATURE = /^[0-9a-f]{128}$/i
const SHA = /^[0-9a-f]{64}$/
const DOMAIN = 'xartists.plugin.manifest.v1\u0000'
const MANIFEST_FIELDS = ['schema', 'pluginId', 'version', 'publisherKeyId', 'issuedAtMs', 'expiresAtMs', 'capabilities', 'resources', 'maxDailyPaperCalls']
const THOUSAND = 1000n

export class PlatformGateError extends Error {
  constructor(code, status = 400) { super(code); this.name = 'PlatformGateError'; this.code = code; this.status = status }
}
function deny(code, status = 400) { throw new PlatformGateError(code, status) }
function isPlain(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype }
function fields(value, allowed) {
  if (!isPlain(value) || Object.keys(value).some(k => !allowed.includes(k)) || Object.keys(value).length !== allowed.length) deny('manifest_schema_invalid')
}
function sortedUnique(xs) { return xs.every((value, i) => i === 0 || xs[i - 1] < value) }
function validTime(value) { return Number.isSafeInteger(value) && value >= 0 }
function sha(value) { return createHash('sha256').update(value).digest('hex') }

export function canonicalManifest(manifest) {
  fields(manifest, MANIFEST_FIELDS)
  if (manifest.schema !== 'xartists.plugin.manifest.v1' || !ID.test(manifest.pluginId) ||
    !VERSION.test(manifest.version) || !KEY_ID.test(manifest.publisherKeyId) ||
    !validTime(manifest.issuedAtMs) || !validTime(manifest.expiresAtMs) ||
    manifest.expiresAtMs <= manifest.issuedAtMs || manifest.expiresAtMs - manifest.issuedAtMs > 31 * 86400_000 ||
    !Number.isInteger(manifest.maxDailyPaperCalls) || manifest.maxDailyPaperCalls < 1 || manifest.maxDailyPaperCalls > 1000 ||
    !Array.isArray(manifest.capabilities) || manifest.capabilities.length < 1 || manifest.capabilities.length > 7 ||
    !manifest.capabilities.every(s => typeof s === 'string' && ALL_SCOPES.includes(s)) || !sortedUnique(manifest.capabilities) ||
    !Array.isArray(manifest.resources) || manifest.resources.length < 1 || manifest.resources.length > 20 ||
    !manifest.resources.every(r => typeof r === 'string' && RESOURCE.test(r)) || !sortedUnique(manifest.resources)
  ) deny('manifest_schema_invalid')
  // Explicit field ordering and types; this is NOT arbitrary JSON canonicalization.
  const normalized = Object.fromEntries(MANIFEST_FIELDS.map(k => [k, manifest[k]]))
  const result = JSON.stringify(normalized)
  if (Buffer.byteLength(result) > 8192) deny('manifest_too_large')
  return result
}
export function manifestDigest(manifest) {
  return sha(DOMAIN + canonicalManifest(manifest))
}
function verifyTrustedSignature(manifest, signatureHex, trust) {
  if (typeof signatureHex !== 'string' || !HEX_SIGNATURE.test(signatureHex)) deny('publisher_signature_invalid', 403)
  const key = trust.trustedPublisherKeys?.[manifest.publisherKeyId]
  const allowedPublisher = trust.allowedPublishers?.[manifest.pluginId]
  if (!key || !Array.isArray(allowedPublisher) || !allowedPublisher.includes(manifest.publisherKeyId)) deny('publisher_untrusted', 403)
  const bytes = Buffer.from(signatureHex, 'hex')
  let publicKey
  try { publicKey = key?.type === 'public' ? key : createPublicKey(key) } catch { deny('publisher_key_invalid', 503) }
  const valid = verify(null, Buffer.from(DOMAIN + canonicalManifest(manifest)), publicKey, bytes)
  if (!valid) deny('publisher_signature_invalid', 403)
}
function actorContext(context) {
  if (!isPlain(context) || !CONTEXT_ID.test(context.actorId) || !CONTEXT_ID.test(context.tenantId) ||
      context.authenticated !== true || typeof context.isAdmin !== 'boolean') deny('authenticated_tenant_actor_required', 401)
  return context
}
export function verifyPluginManifest(payload, trust, nowMs = Date.now()) {
  if (!isPlain(payload) || Object.keys(payload).sort().join(',') !== 'manifest,signatureHex') deny('manifest_envelope_invalid')
  const canonical = canonicalManifest(payload.manifest)
  if (!validTime(nowMs)) deny('manifest_clock_invalid', 503)
  if (payload.manifest.issuedAtMs > nowMs || payload.manifest.expiresAtMs <= nowMs) deny('manifest_expired', 403)
  if (!isPlain(trust) || !isPlain(trust.trustedPublisherKeys) || !isPlain(trust.allowedPublishers) ||
      !(trust.revokedPublishers instanceof Set) || !(trust.revokedDigests instanceof Set)) deny('trust_configuration_invalid', 503)
  const digest = sha(DOMAIN + canonical)
  if (trust.revokedPublishers.has(payload.manifest.publisherKeyId) || trust.revokedDigests.has(digest)) deny('publisher_or_manifest_revoked', 403)
  verifyTrustedSignature(payload.manifest, payload.signatureHex, trust)
  return { digest, manifest: structuredClone(payload.manifest), signatureValid: true }
}

/** Server calls install only after an authenticated human consent event. */
export function createPaperPluginRegistry({ trust, clock = Date.now, guardian = () => ({ paused: true }), consent } = {}) {
  if (!trust || typeof clock !== 'function' || typeof guardian !== 'function' || typeof consent !== 'function') deny('registry_configuration_invalid', 503)
  const installs = new Map() // illustrative only: NOT durable across processes.
  const calls = new Map()
  const now = () => { const ms = clock(); if (!validTime(ms)) deny('registry_clock_invalid', 503); return ms }
  const guard = () => { const g = guardian(); if (!g || g.paused !== false || g.mode !== 'paper') deny('paper_guardian_paused', 503) }
  const keyOf = (tenantId, pluginId) => tenantId + ':' + pluginId
  function install(payload, ctx) {
    const actor = actorContext(ctx)
    guard()
    const attested = verifyPluginManifest(payload, trust, now())
    if (actor.isAdmin !== true || consent({ actorId: actor.actorId, tenantId: actor.tenantId, pluginId: attested.manifest.pluginId, digest: attested.digest }) !== true) deny('installation_consent_required', 403)
    const existing = installs.get(keyOf(actor.tenantId, attested.manifest.pluginId))
    if (existing && !existing.disabled && existing.digest !== attested.digest) deny('explicit_replacement_required', 409)
    const installed = { tenantId: actor.tenantId, pluginId: attested.manifest.pluginId, digest: attested.digest,
      signatureHex: payload.signatureHex, manifest: attested.manifest, disabled: false, installedBy: actor.actorId, installedAt: now() }
    installs.set(keyOf(actor.tenantId, attested.manifest.pluginId), installed)
    return { pluginId: installed.pluginId, digest: installed.digest, mode: 'paper', enabledPaperScopes: installed.manifest.capabilities.filter(s => PAPER_SCOPES.has(s)), liveExecutionEnabled: false }
  }
  function revoke({ pluginId }, ctx) {
    const actor = actorContext(ctx)
    if (!actor.isAdmin) deny('installation_admin_required', 403)
    if (!ID.test(pluginId)) deny('plugin_id_invalid')
    const record = installs.get(keyOf(actor.tenantId, pluginId))
    if (!record) deny('plugin_not_installed', 404)
    record.disabled = true
    return { pluginId, disabled: true }
  }
  function authorize({ pluginId, scope, resource }, ctx) {
    const actor = actorContext(ctx)
    guard()
    if (!ID.test(pluginId) || !ALL_SCOPES.includes(scope) || typeof resource !== 'string' || !RESOURCE.test(resource)) deny('authorization_input_invalid')
    // No implementation can enable financial scopes through manifest, consent, env or user input.
    if (!PAPER_SCOPES.has(scope)) deny('live_scope_unavailable', 403)
    const record = installs.get(keyOf(actor.tenantId, pluginId))
    if (!record || record.disabled) deny('plugin_not_authorized', 403)
    const latest = verifyPluginManifest({ manifest: record.manifest, signatureHex: record.signatureHex }, trust, now())
    if (latest.digest !== record.digest) deny('manifest_changed', 403)
    if (!record.manifest.capabilities.includes(scope) || !record.manifest.resources.includes(resource)) deny('resource_or_scope_ungranted', 403)
    // Caller must supply actor scoped permissions via trusted host context.
    if (!Array.isArray(actor.scopes) || !actor.scopes.includes(scope) || !Array.isArray(actor.resources) || !actor.resources.includes(resource)) deny('actor_scope_or_resource_denied', 403)
    const today = Math.floor(now() / 86400_000)
    const counterKey = keyOf(actor.tenantId, pluginId) + ':' + today
    const count = calls.get(counterKey) ?? 0
    if (count >= record.manifest.maxDailyPaperCalls) deny('paper_daily_cap_reached', 429)
    calls.set(counterKey, count + 1)
    return { authorized: true, mode: 'paper', scope, resource, pluginId,
      tenantId: actor.tenantId, actorId: actor.actorId, manifestDigest: record.digest,
      spendAuthorized: false, chainTransactionHash: null }
  }
  function inspect({ pluginId }, ctx) {
    const actor = actorContext(ctx)
    if (!ID.test(pluginId)) deny('plugin_id_invalid')
    const record = installs.get(keyOf(actor.tenantId, pluginId))
    if (!record) deny('plugin_not_installed', 404)
    return { pluginId, digest: record.digest, disabled: record.disabled, mode: 'paper', liveExecutionEnabled: false,
      capabilities: [...record.manifest.capabilities], paperScopes: record.manifest.capabilities.filter(x => PAPER_SCOPES.has(x)) }
  }
  return Object.freeze({ install, revoke, authorize, inspect })
}
