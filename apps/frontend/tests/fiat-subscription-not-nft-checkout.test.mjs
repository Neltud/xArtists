import {readFileSync} from 'node:fs'
import {test} from 'node:test'
import assert from 'node:assert/strict'

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8')
const policy=read('../src/config/commercialTargets.ts')
const modal=read('../src/components/CheckoutModal.tsx')
const panel=read('../src/components/PackCheckout.tsx')

test('exclusive EUR policy: monthly service subscription is not a Genesis NFT pack payment',()=>{
  assert.match(policy,/FIAT_PACK_NFT_PURCHASE_SUPPORTED = false as const/)
  assert.equal((policy.match(/includesNft: false, requiresWallet: false/g)||[]).length,3)
  assert.match(modal,/if \(rail === 'fiat' && !FIAT_PACK_NFT_PURCHASE_SUPPORTED\) return false/)
  assert.match(modal,/if \(!FIAT_PACK_NFT_PURCHASE_SUPPORTED\) \{/)
  assert.match(modal,/disabled=\{railLocked \|\| !FIAT_PACK_NFT_PURCHASE_SUPPORTED\}/)
  assert.match(modal,/if \(railLocked \|\| !FIAT_PACK_NFT_PURCHASE_SUPPORTED\) return/)
  assert.match(modal,/to="\/offres"/)
  assert.match(modal,/Aucun NFT ne peut être acheté par carte/)
  assert.match(panel,/const payboxReady =\s*FIAT_PACK_NFT_PURCHASE_SUPPORTED &&/)
})

test('EGLD pack gate is not relaxed by the EUR policy correction',()=>{
  assert.match(modal,/if \(!AGENT_PACK_PUBLIC_COMMERCE_RELEASED \|\| import\.meta\.env\.VITE_GENESIS_COMMERCIAL_GO !== '1'\) return false/)
  assert.match(modal,/await confirmGenesisCommerceNow\('crypto'\)/)
  assert.match(modal,/canBuyAgent\(\)/)
  assert.match(modal,/mint_live_enabled === true/)
  assert.match(modal,/mint_dry_run === false/)
  assert.match(modal,/buyerAddress: address!/)
})
