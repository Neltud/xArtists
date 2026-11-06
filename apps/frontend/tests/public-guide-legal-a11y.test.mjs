import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read=(p)=>readFileSync(new URL(p,import.meta.url),'utf8')
const guide=read('../src/pages/DemoTourPage.tsx')
const locale=read('../src/experience/locale.ts')
const legal=read('../src/pages/LegalPage.tsx')
const legalKeys=read('../src/i18n/checkoutLegalKeys.ts')
const access=read('../src/pages/DappAccessPage.tsx')
const modules=read('../src/experience/modules.ts')
const app=read('../src/App.tsx')

test('public guide has eight clear, wallet-free working navigation steps',()=>{
  const destinations=[...guide.matchAll(/\{ to: '([^']+)', label:/g)].map(m=>m[1])
  assert.deepEqual(destinations,['/museum','/studio','/marketplace','/dao','/auction','/lia','/offres','/legal'])
  assert.ok(guide.indexOf('const steps = [') < guide.indexOf('const extra = ['), 'beginner route choices must precede advanced routes')
  assert.match(guide,/xa-guide-advanced/)
  assert.match(guide,/guideSaleNotice/)
  assert.doesNotMatch(guide,/\/slot|Primordial Slot|GO_LIVE|Phase4ReadinessBanner|house funded|SC live/)
  assert.match(app,/path="\/offres"/)
  for(const path of ['/museum','/marketplace','/auction','/studio','/lia','/legal','/dao']){
    assert.ok(modules.includes("'"+path+"'"),'Route alias expected: '+path)
  }
})

test('every public tour phrase has all eight locale strings',()=>{
  const keys=['guideTitle','guideIntro','guideSteps','guideSaleNotice','guideMarketLead','guideOffers','guideOffersLead','guideLegalLead']
  for(const key of keys){
    const found=locale.match(new RegExp('^\\s*'+key+': (\\[[^\\n]+\\]),?$', 'm'))
    assert.ok(found,'missing copy key: '+key)
    const values=JSON.parse(found[1])
    assert.equal(values.length,8,'expected 8 languages for '+key)
    assert.ok(values.every(v=>v.trim().length>0),'no empty locale strings for '+key)
  }
})

test('legal buttons show unambiguous labels and 44px accessible toggles',()=>{
  assert.match(legal,/aria-pressed=\{tab === item.id\}/)
  assert.match(legal,/aria-controls="xa-legal-content"/)
  assert.match(legal,/min-h-\[44px\]/)
  assert.match(legal,/id="xa-legal-content" role="region"/)
  assert.match(legalKeys,/'legal.tab.terms': 'Product terms'/)
  assert.match(legalKeys,/'legal.tab.cgu': 'Terms of use'/)
})

test('app access page has a visible, localized H1',()=>{
  assert.match(access,/<h1 className="[^"]+">\{c\('appAccess'\)\}<\/h1>/)
})
