import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8')
const wallet=read('../src/lib/xportalWc.ts')
const sdk=read('../src/config/sdkDapp.ts')
const modal=read('../src/components/LoginModal.tsx')
const market=read('../src/components/market/MarketplaceVerifiedBuy.tsx')

test('xPortal uses two official WalletConnect relays and never auto-authenticates after timeout',()=>{
  assert.match(sdk,/WALLET_CONNECT_V2_RELAY_URL = 'wss:\/\/relay\.walletconnect\.com'/)
  assert.match(sdk,/WALLET_CONNECT_V2_FALLBACK_RELAY_URL = 'wss:\/\/relay\.walletconnect\.org'/)
  assert.match(wallet,/relayUrls=\[WALLET_CONNECT_V2_RELAY_URL,WALLET_CONNECT_V2_FALLBACK_RELAY_URL\]/)
  assert.match(wallet,/makeProvider\(WalletConnectV2Provider,projectId,relayUrls\[n\]\)/)
  assert.match(wallet,/withDeadline\(candidate\.init\(\),12000/)
  assert.match(wallet,/withDeadline\(candidate\.connect\(\),12000/)
  assert.match(wallet,/typeof session\.uri!=='string'/)
  assert.match(wallet,/typeof session\.approval!=='function'/)
  assert.match(wallet,/if\(signal\.aborted\)throw new Error\('Connexion annulée\.'\)/)
  assert.match(wallet,/if\(n===relayUrls\.length-1\)throw new Error/)
  assert.match(wallet,/if\(!provider\|\|!uri\|\|!approval\)throw new Error/)
  assert.match(wallet,/await activateWalletSession\(provider,approval,signal\)/)
  assert.match(wallet,/if\(\/unauthorized\|forbidden\|origin\|project\.\?id\|401\|403\/i\.test\(message\)\)throw err/)
})
test('user can explicitly cancel the stuck xPortal flow; no read-only wallet can sign',()=>{
  assert.match(modal,/const cancelCurrent = \(\) =>/)
  assert.match(modal,/attempt\.current\+\+/)
  assert.match(modal,/cancelXPortalLogin\(\)/)
  assert.match(modal,/Annuler la connexion xPortal/)
  assert.match(modal,/ouvre le site dans Chrome/)
  assert.match(market,/connected&&canAttemptSign&&!isLiaAddress&&!seller/)
  assert.match(market,/const fresh=await readVerifiedSale\(\)/)
  assert.match(market,/data:'buyNft@02'/)
})
