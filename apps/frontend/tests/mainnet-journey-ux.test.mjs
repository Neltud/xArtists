import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const read=(path)=>readFileSync(new URL(path,import.meta.url),'utf8')
const journey=read('../src/components/MainnetJourney.tsx')
const styles=read('../src/components/MainnetJourney.css')
const home=read('../src/experience/Pages.tsx')
const market=read('../src/pages/MarketplacePage.tsx')
const studio=read('../src/pages/StudioPage.tsx')
const studioHook=read('../src/hooks/useStudioMintTx.ts')
const mintTx=read('../src/lib/studioOnChainMint.ts')
const gates=read('../src/config/scStatus.ts')

test('Home, Marketplace and Studio expose the same three-step mainnet navigation',()=>{
  assert.match(home, /<MainnetJourney current="home"\s*\/>/)
  assert.match(market, /<MainnetJourney current="market"\s*\/>/)
  assert.match(studio, /<MainnetJourney current="studio"\s*\/>/)
  assert.match(journey, /\{id:'home',to:'\/'/)
  assert.match(journey, /\{id:'market',to:'\/marketplace'/)
  assert.match(journey, /\{id:'studio',to:'\/studio'/)
  assert.match(journey, /aria-current=\{current===item\.id\?'step':undefined\}/)
  assert.match(journey, /aria-label=\{copy\.stepsLabel\}/)
})

test('mainnet display uses chain ID 1 and preserves real Explorer, not a mock explorer',()=>{
  assert.match(journey, /chainID 1/)
  assert.match(journey, /https:\/\/explorer\.multiversx\.com\//)
  assert.match(journey, /rel="noopener noreferrer"/)
  assert.match(journey, /xportalLive=connected&&method==='xportal'&&sessionLive===true/)
  assert.match(journey, /onClick=\{requestOpenConnect\}/)
  assert.doesNotMatch(journey, /sendTransaction|signTransaction|setMintLive|setCheckout|dispatchMint/)
})

test('all eight locales and accessible light-dark styling are retained',()=>{
  for(const language of ['fr','en','es','de','ru','uk','zh','ar'])
    assert.match(journey,new RegExp('^ '+language+':\\{', 'm'))
  assert.match(journey, /Record<Lang,JourneyCopy>/)
  assert.match(styles, /var\(--xa-text\)/)
  assert.match(styles, /var\(--xa-panel\)/)
  assert.match(styles, /\.xa-mainnet-journey-link:focus-visible/)
  assert.match(styles, /prefers-reduced-motion: reduce/)
  assert.match(styles, /max-width: 490px/)
  assert.match(styles, /min-height: 44px/)
})

test('Studio retains real artist-signed MultiversX mainnet issue, role and mint actions',()=>{
  for(const name of ['useStudioMintTx','runIssue','runRole','runMint','CreatorMediaUpload','ArtworkTurntableLab']){
    assert.ok(studio.includes(name),'Lost Studio feature: '+name)
  }
  for(const name of ['buildIssueNftCollectionTx','buildSetNftCreateRoleTx','buildEsdtNftCreateTx','verifyArtistTransaction']){
    assert.ok(studioHook.includes(name),'Missing mainnet action '+name)
  }
  assert.match(studioHook, /useSendTransaction/)
  assert.match(studioHook, /method === 'paste_readonly'/)
  assert.match(mintTx, /chainID:'1'/)
  assert.match(mintTx, /ESDTRoleNFTCreate/)
  assert.match(mintTx, /https:\/\/api\.multiversx\.com/)
  assert.match(mintTx, /fetchArtistCollectionProof/)
})

test('marketplace transactions retain fresh on-chain codehash and build gate',()=>{
  assert.match(market, /const live=canListBuyNft\(\)/)
  assert.match(gates, /isLiveGate\(MARKETPLACE_LIVE, runtimeCodehashOk\('marketplace'\)\)/)
  assert.match(gates, /isUsableScAddress\(MARKETPLACE_ADDRESS\)/)
  assert.match(market,/Vérifier sur Explorer/)
  assert.doesNotMatch(journey+home+styles, /VITE_LIA_LIVE_TRADING\s*=\s*1|mint_live_enabled\s*:\s*true|paybox_checkout_enabled\s*:\s*true/)
})

test('entry journeys never require a wallet to browse',()=>{
  assert.match(home,/to="\/museum"/)
  assert.match(home,/to="\/marketplace"/)
  assert.match(home,/to="\/studio"/)
  assert.match(market,/to="\/studio"/)
  assert.match(studio,/to="\/marketplace"/)
  assert.match(journey,/connected\s*\n\s*\?/)
})
