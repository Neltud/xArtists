import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, sign } from 'node:crypto'
import {
  canonicalManifest, manifestDigest, verifyPluginManifest, createPaperPluginRegistry,
} from '../src/platform.mjs'
import { createPaperRevenueRouter } from '../src/revenue.mjs'

const keys = generateKeyPairSync('ed25519')
const secondary = generateKeyPairSync('ed25519')
const T0 = 1_000_000
const trust = () => ({
  trustedPublisherKeys: { 'publisher-A': keys.publicKey, 'publisher-B': secondary.publicKey },
  allowedPublishers: { 'lia-intent': ['publisher-A'], 'genesis-art-engine': ['publisher-A'] },
  revokedPublishers: new Set(), revokedDigests: new Set(),
})
const manifest = (changes = {}) => ({
  schema: 'xartists.plugin.manifest.v1', pluginId: 'lia-intent', version: '0.1.0',
  publisherKeyId: 'publisher-A', issuedAtMs: T0, expiresAtMs: T0 + 100_000,
  capabilities: ['art:generate:paper', 'orders:prepare:paper', 'read:catalog'],
  resources: ['art:genesis', 'pack:pulse'], maxDailyPaperCalls: 2, ...changes,
})
const signed = (m, privateKey = keys.privateKey) => ({
  manifest: m, signatureHex: sign(null, Buffer.from('xartists.plugin.manifest.v1\0' + canonicalManifest(m)), privateKey).toString('hex'),
})
const context = (changes = {}) => ({
  authenticated: true, isAdmin: true, actorId: 'actor-owner01', tenantId: 'tenant-001',
  scopes: ['orders:prepare:paper', 'read:catalog'], resources: ['pack:pulse'], ...changes,
})
const build = (options = {}) => {
  const t = options.trust ?? trust()
  const time = options.clock ?? (() => T0 + 5_000)
  const guardian = options.guardian ?? (() => ({ paused: false, mode: 'paper' }))
  const registry = createPaperPluginRegistry({ trust: t, clock: time, guardian, consent: options.consent ?? (() => true) })
  const m = options.manifest ?? manifest()
  const data = signed(m)
  const install = (ctx = context()) => registry.install(data, ctx)
  return { registry, trust: t, m, data, install }
}
const revenueInput = (change = {}) => ({
  schema: 'xartists.revenue.paper.v1', pluginId: 'lia-intent', resource: 'pack:pulse',
  idempotencyKey: 'evt-00000001', currency: 'EUR', grossMinor: '11000',
  pspMinor: '250', providerMinor: '300', storageMinor: '100', relayerMinor: '20',
  refundMinor: '0', rebateMinor: '30', creatorShareBps: 6000, ...change,
})

test('signed manifest is valid, deterministic, bounded and does not authorize trading', () => {
  const m = manifest()
  assert.equal(verifyPluginManifest(signed(m), trust(), T0 + 1).signatureValid, true)
  assert.equal(manifestDigest({...m}), manifestDigest(m))
  assert.equal(manifestDigest(m).length, 64)
  assert.ok(canonicalManifest(m).startsWith('{"schema"'))
  assert.throws(() => canonicalManifest({ ...m, evil: 'test' }), /manifest_schema_invalid/)
})

test('tampering with the permissions, publisher, resource or signed cap fails cryptographic verification', () => {
  const p = signed(manifest())
  for (const change of [
    { maxDailyPaperCalls: 1000 },
    { resources: ['art:genesis', 'pack:yield'] },
    { capabilities: ['read:catalog'] },
    { publisherKeyId: 'publisher-B' },
  ]) {
    assert.throws(() => verifyPluginManifest({ ...p, manifest: manifest(change) }, trust(), T0 + 1), /signature_invalid|publisher_untrusted/)
  }
})

test('unknown, revoked, expired or future publisher grant fails closed', () => {
  const m = manifest()
  const p = signed(m)
  assert.throws(() => verifyPluginManifest(p, trust(), T0 - 1), /manifest_expired/)
  assert.throws(() => verifyPluginManifest(p, trust(), m.expiresAtMs), /manifest_expired/)
  const t = trust()
  t.revokedPublishers.add('publisher-A')
  assert.throws(() => verifyPluginManifest(p, t, T0 + 1), /publisher_or_manifest_revoked/)
  t.revokedPublishers.clear()
  t.revokedDigests.add(manifestDigest(m))
  assert.throws(() => verifyPluginManifest(p, t, T0 + 1), /publisher_or_manifest_revoked/)
  t.revokedDigests.clear()
  t.allowedPublishers = {}
  assert.throws(() => verifyPluginManifest(p, t, T0 + 1), /publisher_untrusted/)
  assert.throws(() => verifyPluginManifest({ ...p, signatureHex: '0'.repeat(128) }, trust(), T0 + 1), /publisher_signature_invalid/)
})

test('malformed manifests, unordered capabilities, resource wildcard, weird numbers and extra fields rejected', () => {
  for (const value of [
    manifest({ capabilities: ['read:catalog', 'read:catalog'] }),
    manifest({ capabilities: ['read:catalog', 'orders:prepare:paper'] }),
    manifest({ resources: ['art:*'] }),
    manifest({ maxDailyPaperCalls: 0 }),
    manifest({ maxDailyPaperCalls: 1.5 }),
    manifest({ issuedAtMs: Infinity }),
    manifest({ expiresAtMs: T0 + 32*86400_000 }),
    manifest({ randomKey: true }),
  ]) assert.throws(() => canonicalManifest(value), /manifest_schema_invalid/)
})

test('installation requires a live explicit admin consent and authenticated actor', () => {
  const { registry, data } = build({ consent: () => false })
  assert.throws(() => registry.install(data, context()), /installation_consent_required/)
  const x = build()
  assert.throws(() => x.registry.install(x.data, context({ isAdmin: false })), /installation_consent_required/)
  assert.throws(() => x.registry.install(x.data, context({ authenticated: false })), /authenticated_tenant_actor_required/)
  const receipt = x.install()
  assert.equal(receipt.mode, 'paper')
  assert.equal(receipt.liveExecutionEnabled, false)
  assert.equal(receipt.enabledPaperScopes.length, 3)
})

test('paper authorization is least-privilege, tenant-isolated and resource pinned', () => {
  const { registry, install } = build()
  install()
  const ok = registry.authorize({ pluginId: 'lia-intent', scope: 'read:catalog', resource: 'pack:pulse' }, context())
  assert.equal(ok.spendAuthorized, false)
  assert.equal(ok.mode, 'paper')
  assert.equal(ok.chainTransactionHash, null)
  assert.throws(() => registry.authorize({ pluginId: 'lia-intent', scope: 'read:catalog', resource: 'pack:yield' }, context()), /resource_or_scope_ungranted/)
  assert.throws(() => registry.authorize({ pluginId: 'lia-intent', scope: 'read:catalog', resource: 'pack:pulse' }, context({ tenantId: 'tenant-other' })), /plugin_not_authorized/)
  assert.throws(() => registry.authorize({ pluginId: 'lia-intent', scope: 'read:catalog', resource: 'pack:pulse' }, context({ scopes: [] })), /actor_scope_or_resource_denied/)
  assert.throws(() => registry.authorize({ pluginId: 'lia-intent', scope: 'read:catalog', resource: 'pack:pulse' }, context({ resources: [] })), /actor_scope_or_resource_denied/)
})

test('publisher signing live capabilities does not grant live scope or execute anything', () => {
  const m = manifest({ capabilities: ['orders:prepare:paper', 'payments:execute'] })
  const x = build({ manifest: m })
  x.install()
  assert.throws(() => x.registry.authorize({ pluginId: 'lia-intent', scope: 'payments:execute', resource: 'pack:pulse' }, context({ scopes:['payments:execute'] })), /live_scope_unavailable/)
})

test('revocation, expiration and pause prevent further authorization', () => {
  const t = trust(), x = build({ trust: t })
  x.install()
  t.revokedDigests.add(x.registry.inspect({ pluginId: 'lia-intent' }, context()).digest)
  assert.throws(() => x.registry.authorize({ pluginId: 'lia-intent', scope: 'read:catalog', resource: 'pack:pulse' }, context()), /revoked/)
  t.revokedDigests.clear()
  x.registry.revoke({ pluginId: 'lia-intent' }, context())
  assert.throws(() => x.registry.authorize({ pluginId: 'lia-intent', scope: 'read:catalog', resource: 'pack:pulse' }, context()), /plugin_not_authorized/)
  assert.throws(() => x.registry.revoke({ pluginId: 'lia-intent' }, context({ isAdmin:false })), /installation_admin_required/)
  const afterExpiry = build({ clock: () => T0 + 200_000 })
  assert.throws(() => afterExpiry.install(), /manifest_expired/)
  const paused = build({ guardian: () => ({ paused: true, mode: 'paper' }) })
  assert.throws(() => paused.install(), /paper_guardian_paused/)
})

test('per-manifest paper quotas enforce fail-closed bounds', () => {
  const x = build()
  x.install()
  const req = { pluginId: 'lia-intent', scope: 'read:catalog', resource: 'pack:pulse' }
  x.registry.authorize(req,context())
  x.registry.authorize(req,context())
  assert.throws(() => x.registry.authorize(req,context()), /paper_daily_cap_reached/)
})

test('paper revenue: exact integer minor units and visible zero recognized revenue', () => {
  const x = build(), r = createPaperRevenueRouter({ authorize: x.registry.authorize, clock: () => T0 + 5000 })
  x.install()
  const receipt = r.simulate(revenueInput(), context())
  assert.equal(receipt.grossEstimateMinor,'11000')
  assert.equal(receipt.totalCostEstimateMinor,'700')
  assert.equal(receipt.netEstimateMinor,'10300')
  assert.equal(receipt.creatorEstimateMinor,'6180')
  assert.equal(receipt.platformEstimateMinor,'4120')
  assert.equal(receipt.recognizedRevenueMinor,'0')
  assert.equal(receipt.actualCreatorPaidMinor,'0')
  assert.equal(receipt.settlementReference,null)
  assert.equal(receipt.paymentVerified,false)
  assert.equal(receipt.transferSubmitted,false)
})

test('idempotency replay is non-charging and cross-tenant/actor safe', () => {
  const x = build(), r = createPaperRevenueRouter({ authorize: x.registry.authorize })
  x.install()
  const one = r.simulate(revenueInput(), context())
  const again = r.simulate(revenueInput(), context())
  assert.deepEqual(again, one)
  assert.throws(() => r.simulate(revenueInput({ grossMinor: '11100' }), context()), /paper_idempotency_conflict/)
  assert.throws(() => r.simulate(revenueInput(), context({ actorId:'actor-other01' })), /paper_revenue_not_found/)
  assert.throws(() => r.simulate(revenueInput(), context({ tenantId:'tenant-002' })), /plugin_not_authorized/)
  r.simulate(revenueInput({ idempotencyKey:'evt-00000002' }), context())
  assert.throws(() => r.simulate(revenueInput({ idempotencyKey:'evt-00000003' }), context()), /paper_daily_cap_reached/)
})

test('negative estimates never create creator payouts, and all real settlement stays zero', () => {
  const x = build()
  x.install()
  const r = createPaperRevenueRouter({ authorize: x.registry.authorize })
  const e = r.simulate(revenueInput({ refundMinor: '11000' }), context())
  assert.equal(e.netEstimateMinor, '-700')
  assert.equal(e.creatorEstimateMinor,'0')
  assert.equal(e.platformEstimateMinor,'0')
  assert.equal(e.unallocatedLossEstimateMinor,'-700')
  assert.equal(e.recognizedRevenueMinor,'0')
})

test('invalid money, foreign currency and fabricated proof fields are rejected', () => {
  const x = build()
  x.install()
  const r = createPaperRevenueRouter({ authorize: x.registry.authorize })
  for (const change of [
    { grossMinor:'1.00' }, { grossMinor:'0' }, { grossMinor:'-1' },
    { grossMinor:'999999999999999' }, { currency:'SOL' },
    { creatorShareBps:10001 }, { grossMinor:11000 },
    { txHash: 'fake-chain-hash' }, { paymentVerified:true },
  ]) assert.throws(() => r.simulate(revenueInput(change), context()), /paper_revenue_\w+_invalid/)
})

test('reconciliation is tenant-scoped and reports no verified actual receipts', () => {
  const x=build()
  x.install()
  const r=createPaperRevenueRouter({authorize:x.registry.authorize})
  r.simulate(revenueInput(),context())
  r.simulate(revenueInput({idempotencyKey:'evt-00000002'}),context())
  const report=r.reconcile({pluginId:'lia-intent'},context())
  assert.equal(report.paperEventCount,2)
  assert.equal(report.netEstimateMinor,'20600')
  assert.equal(report.actualRevenueVerifiedMinor,'0')
  assert.equal(report.settledEventsCount,0)
  assert.equal(r.reconcile({pluginId:'lia-intent'}, context({tenantId:'tenant-002'})).paperEventCount,0)
  assert.throws(()=>r.reconcile({pluginId:'lia-intent'},context({isAdmin:false})),/paper_revenue_admin_required/)
})
