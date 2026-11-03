import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { auditTroSupply, formatAtomic, TRO_ID, TRO_OWNER } from '../../../scripts/tro_supply_audit.mjs'

const baseToken = {
  identifier: TRO_ID, owner: TRO_OWNER, decimals: 6,
  initialMinted: '500000000000', minted: '0', burnt: '23776101161',
  canMint: true, canUpgrade: true, totalLiquidity: 12,
}
const baseSupply = {
  initialMinted: '500000000000', minted: '0', burnt: '23776101161', supply: '476224',
}
const baseBridge = {
  source: { tokenIdentifier: TRO_ID },
  destination: { mintAddress: null },
  bridge: { status: 'disabled', transferAvailable: false },
  sale: { directSaleLive: false },
}

test('exact TRO supply is 6-decimal atomic accounting; NEVER convert by 1e18', () => {
  const got = auditTroSupply(baseToken, baseSupply, baseBridge)
  assert.equal(got.ok, true)
  assert.equal(got.launchReady, false)
  assert.equal(got.exactSupplyAtomic, '476223898839')
  assert.equal(got.exactSupplyTro, '476223.898839')
  assert.equal(formatAtomic(1000000n), '1')
  assert.match(got.warnings.join(' '), /canMint/)
})

test('incorrect metadata, decimals, owner or conflicting supply fails closed', () => {
  for (const patch of [
    { decimals: 18 }, { identifier: 'TRO-fake' }, { owner: 'erd1attacker' },
    { burnt: '23776101162' },
  ]) {
    assert.equal(auditTroSupply({ ...baseToken, ...patch }, baseSupply, baseBridge).ok, false)
  }
  assert.equal(auditTroSupply(baseToken, { ...baseSupply, burnt: '999999999999' }, baseBridge).ok, false)
  assert.equal(auditTroSupply(baseToken, { ...baseSupply, supply: '650000' }, baseBridge).ok, false)
})

test('no direct sale, Solana mint or bridge may be inferred from a token quote', () => {
  for (const altered of [
    { bridge: { ...baseBridge.bridge, status: 'enabled' } },
    { destination: { mintAddress: 'some-unattested-mint' } },
    { sale: { directSaleLive: true } },
    { bridge: { ...baseBridge.bridge, transferAvailable: true } },
  ]) {
    assert.equal(auditTroSupply(baseToken, baseSupply, { ...baseBridge, ...altered }).ok, false)
  }
})

test('pool reference uses verified 6 decimals and never asserts stale USD liquidity', () => {
  const pool = JSON.parse(readFileSync(new URL('../../../data/tro_pool.json', import.meta.url), 'utf8'))
  assert.equal(pool.token, TRO_ID)
  assert.equal(pool.decimals, 6)
  for (const p of pool.pools) assert.equal(p.liquidity_usd_approx, null)
})

test('Burnify batch eligibility defaults to false until official on-chain verification', () => {
  const cfg = readFileSync(new URL('../../../lia/burnify/config.py', import.meta.url), 'utf8')
  const builder = readFileSync(new URL('../../../lia/burnify/tx_builder.py', import.meta.url), 'utf8')
  assert.match(cfg, /tro_listed: bool = False/)
  assert.match(builder, /"BURNIFY_BATCH_SC"/)
  assert.ok(!builder.includes('kind="signed_burn"'))
})
