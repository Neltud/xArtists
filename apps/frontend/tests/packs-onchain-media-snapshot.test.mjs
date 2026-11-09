import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8')
const manifest=JSON.parse(read('../public/data/contracts.json'))
const packs=read('../src/config/agentPacks.ts')
const ui=read('../src/pages/Agents.tsx')
const gates=read('../src/config/scStatus.ts')

test('mainnet registry reports exact observed six empty-media NFTs without a fabricated nonce 5',()=>{
  const entry=manifest.pack_collection_media_readback
  assert.equal(entry.observed_date,'2026-11-09')
  assert.equal(manifest.probed_at.startsWith('2026-11-08'),true,
    'Do not pretend all unrelated contracts were re-probed today')
  assert.equal(entry.total_nfts_indexed,6)
  assert.equal(entry.total_nonempty_media_uris,0)
  assert.deepEqual(entry.collections.pulse.nonces,[1,2,3,4])
  assert.equal(entry.collections.pulse.count,4)
  assert.equal(entry.collections.pulse.nonce_5_present,false)
  assert.equal(entry.collections.yield.count,1)
  assert.equal(entry.collections.sentinel.count,1)
  for(const collection of Object.values(entry.collections))
    assert.equal(collection.nonempty_uris,0)
  assert.equal(entry.public_pack_commerce_released,false)
  assert.equal(entry.genesis_005_mint_verified,false)
  assert.equal(entry.independent_ipfs_pins_verified,false)
})

test('source URLs are real public MultiversX queries, not arbitrary endpoints',()=>{
  const src=manifest.pack_collection_media_readback.sources
  assert.equal(Object.keys(src).length,4)
  for(const url of Object.values(src)){
    const u=new URL(url)
    assert.equal(u.protocol,'https:')
    assert.equal(u.hostname,'api.multiversx.com')
    assert.equal(u.searchParams.get('size'),url===src.role?'30':'20')
  }
  assert.deepEqual(manifest.pack_collection_media_readback.agents_minter_sc_role,
    ['ESDTRoleNFTCreate'])
  assert.equal(manifest.pack_collection_media_readback.can_add_uri,false)
  assert.equal(manifest.pack_collection_media_readback.can_update_attributes,false)
})

test('novice packs page displays scope-dated missing media without wallet requirement',()=>{
  assert.match(packs,/export const AGENT_PACK_MEDIA_SNAPSHOT/)
  assert.match(packs,/observedDate: '2026-11-09'/)
  assert.match(packs,/indexedTotal: 6/)
  assert.match(packs,/mediaReadyTotal: 0/)
  assert.match(packs,/isLive: false/)
  assert.match(ui,/AGENT_PACK_MEDIA_SNAPSHOT\.observedDate/)
  assert.match(ui,/role="status"/)
  assert.match(ui,/Médias NFT mainnet non prêts · achats suspendus/)
  assert.match(ui,/URI média renseignée/)
  assert.match(ui,/Pulse #005 non émis/)
  assert.match(ui,/AGENT_PACK_MEDIA_SNAPSHOT\.packs\[p\.id\]/)
  assert.match(ui,/https:\/\/api\.multiversx\.com\/collections\/XAIPLS-2cf72b\/nfts\?size=20/)
  assert.match(ui,/rel="noopener noreferrer"/)
  assert.doesNotMatch(ui,/wallet.*required to view|setCommerceLive\(true\)/i)
})

test('on-chain media alert never opens EGLD purchases or treats direct-payable flag as endpoint proof',()=>{
  assert.match(gates,/AGENT_PACK_PUBLIC_COMMERCE_RELEASED = false/)
  assert.match(gates,/AGENT_PACK_PUBLIC_MINT_RELEASED = false/)
  assert.match(manifest.verification.agents_marketplace,/PUBLIC NO-GO/)
  assert.doesNotMatch(manifest.verification.agents_marketplace,
    /pack EGLD intake blocked at protocol/)
  assert.equal(manifest.pack_collection_media_readback.code_hash_reverified,
    manifest.codeHash.agents_marketplace)
})
