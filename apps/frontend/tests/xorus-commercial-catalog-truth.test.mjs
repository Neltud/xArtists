import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8')
const page=read('src/pages/CommercialLaunchPage.tsx')
const hook=read('src/hooks/useCommercialCatalog.ts')
const targets=read('src/config/commercialTargets.ts')

test('3 EUR targets remain visibly independent of xOrus research tracks and NFT packs',()=>{
  assert.match(page,/MAINSTREAM_PREVIEW\.map/)
  assert.match(page,/GENESIS_PREVIEW\.map/)
  assert.match(page,/XORUS_ANALYSIS_TRACKS_PREVIEW\.map/)
  assert.match(page,/scope_mapping_approved/)
  // Product scopes are contract candidates, never extra NFT rights.
  assert.match(targets,/id: 'pulse', scope: 'analysis:markets'/)
  assert.match(targets,/id: 'yield', scope: 'analysis:defi'/)
  assert.match(targets,/id: 'sentinel', scope: 'analysis:risk'/)
  assert.match(page,/Nos propres synthèses|propres synthèses|sell our derived commentary/)
})

test('availability comes from only a safe, bounded public GET API and stays no-pay',()=>{
  assert.match(page,/useCommercialCatalog/)
  assert.match(page,/commercial-server-status/)
  assert.match(page,/catalog\.monthly_services\.find/)
  assert.match(hook,/GET|method:'GET'/)
  assert.match(hook,/\/v1\/commercial\/catalog/)
  assert.match(hook,/credentials:'omit'/)
  assert.match(hook,/cache:'no-store'/)
  assert.match(hook,/AbortController/)
  assert.match(hook,/setStatus\('unavailable'\)/)
  assert.match(hook,/raw\.sale_open!==false/)
  assert.match(hook,/raw\.billing_checkout_enabled!==false/)
  assert.match(hook,/scope_mapping_approved!==false/)
  assert.doesNotMatch(page,/<CheckoutModal|<PackCheckout|createCheckoutSession/)
  assert.doesNotMatch(hook,/Authorization|localStorage|sessionStorage|token/)
  assert.match(page,/aucun paiement actif/)
  assert.match(page,/no live payments/)
})

test('unknown API state never activates checkout or premium access',()=>{
  assert.match(page,/apiUnavailable/)
  assert.match(page,/catalogStatus === 'verified'/)
  assert.match(page,/catalogStatus === 'loading'/)
  assert.match(page,/c\.apiUnavailable/)
  assert.match(page,/not (?:yet|commercially)|non commercialisé/)
})
