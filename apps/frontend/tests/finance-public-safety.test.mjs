import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read = p => readFileSync(new URL(p,import.meta.url),'utf8')
const pages=read('../src/experience/Pages.tsx')
const registry=read('../src/experience/modules.ts')
const hatom=read('../src/pages/HatomPage.tsx')
const tip=read('../src/pages/Tip.tsx')
const ads=read('../src/pages/AdsPage.tsx')
const rwa=read('../src/pages/RwaCatalogPage.tsx')
const status=read('../src/pages/GoLivePage.tsx')

test('Hatom and support route mount their polling provider, without global always-on polling',()=>{
  assert.match(hatom,/useMultiversX\(\)/)
  assert.match(tip,/useMultiversX\(\)/)
  assert.match(pages,/import \{ MultiversXProvider \}/)
  assert.match(pages,/m\.id==='hatom'\|\|m\.id==='tip'/)
  assert.match(pages,/<MultiversXProvider><Page\/><\/MultiversXProvider>/)
  assert.doesNotMatch(read('../src/main.tsx'), /<MultiversXProvider>/)
})

test('public ad preview has zero manual crypto payment instructions or bid dispatch',()=>{
  assert.match(ads,/Présentation uniquement/)
  assert.match(ads,/Ne transférez pas d’EGLD/)
  assert.doesNotMatch(ads,/dispatch8008|LIA_WALLET|copyMemo|navigator\.clipboard|payer EGLD|ad-bid:|paiement manuel|txHash/)
  assert.doesNotMatch(ads,/<input|<form|<select|useSendTransaction/)
})

test('RWA paper values, custody and certificates cannot be represented as verified sales',()=>{
  const catalog=JSON.parse(read('../public/data/rwa_catalog.json'))
  assert.equal(catalog.paper,true)
  assert.match(rwa,/Catalogue de démonstration/)
  assert.match(rwa,/Exemple éditorial · pas de mise en vente certifiée/)
  assert.match(rwa,/Garde physique : non vérifiée/)
  assert.match(rwa,/Valeur fictive indicative/)
  assert.doesNotMatch(rwa,/Catalog empty — run rwa_evaluator|LIA_LIVE_TRADING=0/)
})

test('status page defaults to visitor-first with operator metrics behind an explicit toggle',()=>{
  assert.match(status,/Disponibilité des services/)
  assert.match(status,/showDiagnostics, setShowDiagnostics.*useState\(false\)/)
  assert.match(status,/aria-expanded=\{showDiagnostics\}/)
  assert.match(status,/\{showDiagnostics && <section id="xa-operator-diagnostics"/)
  assert.match(status,/Mode découverte et démonstration uniquement/)
})

test('read-only $TRO portal has no extra CSS/JS lazy preload on direct navigation',()=>{
  assert.match(registry,/import TroCrosschainPage from '\.\.\/pages\/TroCrosschainPage'/)
  assert.match(registry,/Promise\.resolve\(\{default:TroCrosschainPage\}\)/)
  assert.doesNotMatch(registry,/\(\)=>import\('\.\.\/pages\/TroCrosschainPage'\)/)
})
