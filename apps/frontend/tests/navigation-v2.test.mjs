import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {transform} from 'esbuild'

const nav=readFileSync(new URL('../src/experience/navigation.ts',import.meta.url),'utf8')
const shell=readFileSync(new URL('../src/experience/Shell.tsx',import.meta.url),'utf8')
const css=readFileSync(new URL('../src/experience/beginner-navigation.css',import.meta.url),'utf8')
const compiled=await transform(nav,{loader:'ts',format:'esm',target:'es2022'})
const {currentPrimarySection,matchesDockRoute}=await import(
  'data:text/javascript;base64,'+Buffer.from(compiled.code).toString('base64'))

test('primary menu highlights the correct section across canonical paths and aliases',()=>{
  for(const p of ['/museum','/explore/museum','/explore/maison','/gallery'])
    assert.equal(currentPrimarySection(p),'explore',p)
  for(const p of ['/studio','/create/studio','/nft-factory','/create/world-rights','/digital-twin'])
    assert.equal(currentPrimarySection(p),'create',p)
  for(const p of ['/marketplace','/market','/auction','/explore/auction','/rwa','/explore/rwa','/explore/market'])
    assert.equal(currentPrimarySection(p),'market',p)
  for(const p of ['/dao','/finance/governance/'])
    assert.equal(currentPrimarySection(p),'dao',p)
  for(const p of ['/guide','/roadmap','/feuille-de-route'])
    assert.equal(currentPrimarySection(p),'guide',p)
  for(const p of ['/','/intelligence/lia','/workspace/wallet','/finance/trading'])
    assert.equal(currentPrimarySection(p),null,p)
})

test('dock route families never let root or route prefixes shadow other pages',()=>{
  assert.equal(matchesDockRoute('/', ['/']),true)
  assert.equal(matchesDockRoute('/studio',['/']),false)
  assert.equal(matchesDockRoute('/create/studio/', ['/create/studio']),true)
  assert.equal(matchesDockRoute('/create/studio/preview',['/create/studio']),true)
  assert.equal(matchesDockRoute('/studio-malicious',['/studio']),false)
  assert.equal(matchesDockRoute('/finance/governance-votes',['/finance/governance']),false)
  assert.equal(matchesDockRoute('/marketplace?tab=opensea',['/marketplace']),true)
})

test('mobile dock is discovery-first while auction and DAO remain discoverable',()=>{
  const match=shell.match(/const MOBILE_DESTINATIONS = \[([\s\S]*?)\] as const/)
  assert.ok(match)
  const to=[...match[1].matchAll(/to:'([^']+)'/g)].map(x=>x[1])
  assert.deepEqual(to,['/','/museum','/studio','/marketplace','/finance/governance'])
  assert.match(shell,/matchesDockRoute\(location\.pathname,item\.paths\)/)
  for(const p of ['/auction','/rwa','/dao','/nft-factory','/create/world-rights','/wallet','/portfolio','/directory']){
    assert.ok(shell.includes('to="'+p+'" onClick={closeMobile}'),p)
  }
  assert.match(shell,/xa-mobile-advanced/)
})

test('search starts with six curated paths and caps results, with escape to full directory',()=>{
  assert.match(shell,/\.slice\(0,q\.trim\(\)\?12:6\)/)
  assert.match(shell,/\['museum','studio','market','dao','agents','guide'\]/)
  assert.match(shell,/className="xa-search-all"/)
  assert.match(shell,/role="combobox"/)
  assert.match(shell,/role="listbox"/)
  assert.match(shell,/setSelected\(i=>Math\.min\(i\+1,Math\.max\(0,results\.length-1\)\)\)/)
})

test('navigation keeps default light and alternate dark mode with accessible focus targets',()=>{
  assert.match(shell,/className="xa-icon-button xa-theme-toggle"/)
  assert.match(shell,/primarySection===id/)
  assert.match(shell,/aria-current=\{primarySection===id\?'page':undefined\}/)
  assert.match(css,/\.xa-search-all:focus-visible/)
  assert.match(css,/var\(--xa-accent\)/)
  assert.match(css,/prefers-reduced-motion/)
  assert.doesNotMatch(shell+css,/mint_live_enabled\s*=\s*true|VITE_LIA_LIVE_TRADING\s*=\s*1/)
})
