import {test,expect} from '@playwright/test'
import {readFileSync,mkdirSync} from 'node:fs'

const collected=JSON.parse(readFileSync(new URL('../tests/fixtures/xorus_analysis_collected.json',import.meta.url),'utf8'))
const empty=JSON.parse(readFileSync(new URL('../apps/frontend/public/data/xorus_analysis_preview.json',import.meta.url),'utf8'))
mkdirSync('artifacts/ux-mobile',{recursive:true})
const headers={'access-control-allow-origin':'*'}
function current(report:typeof collected){
  const out=structuredClone(report)
  out.generated_at=new Date().toISOString().slice(0,19)+'Z'
  out.collection.received_at=out.generated_at
  if(out.collection.state==='observed')out.source_ts=new Date(Math.floor(Date.now()/3600000)*3600000-1000).toISOString().slice(0,19)+'Z'
  return out
}

for(const [lang,width] of [['fr',390],['en',1440]] as const){
  test(`xOrus server analysis ${lang} at ${width}px: observed source then API outage`,async({page})=>{
    await page.setViewportSize({width,height:900})
    let unavailable=false,legacyRequests=0
    await page.route('**/data/xorus_analysis_preview.json',route=>{legacyRequests++;return route.abort()})
    await page.route('https://analysis-api.invalid/v1/xorus/analysis',route=>unavailable
      ?route.fulfill({status:503,headers,json:{ok:false,error:'analysis_unavailable'}})
      :route.fulfill({headers,json:{ok:true,report:{...current(collected),provider_payload:'private-provider-secret'}}}))
    await page.route('https://api.multiversx.com/economics*',route=>route.fulfill({status:503,body:'unavailable'}))
    await page.goto(`/intelligence/xorus/?lang=${lang}`,{waitUntil:'domcontentloaded'})
    const desk=page.getByTestId('xorus-decision-desk'),analysis=page.getByTestId('xorus-analysis-report')
    await expect(desk).toContainText(lang==='fr'?'Analyse calculée sur 6 indicateurs':'Analysis calculated from 6')
    await expect(analysis).toContainText('Binance Spot · EGLD/USDT')
    await expect(analysis).toContainText(lang==='fr'?'Observations clôturées le':'Observations closed at')
    await expect(desk).toContainText(lang==='fr'?'S’ABSTENIR':'ABSTAIN')
    await analysis.locator('summary').click()
    await expect(analysis).toContainText(lang==='fr'?'indicateurs contradictoires':'conflicting indicators')
    await expect(analysis).not.toContainText('private-provider-secret')
    expect(legacyRequests).toBe(0)
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(12)
    await page.screenshot({animations:'disabled',path:`artifacts/ux-mobile/xorus-server-${lang}-${width}.png`})
    unavailable=true
    await page.getByRole('button',{name:lang==='fr'?'Actualiser les sources':'Check sources'}).click()
    await expect(analysis).toContainText(lang==='fr'?'Rapport indisponible ou non conforme':'Report unavailable or invalid')
    await expect(analysis).not.toContainText(lang==='fr'?'indicateurs contradictoires':'conflicting indicators')
    expect(legacyRequests).toBe(0)
  })

  test(`xOrus server analysis ${lang}: rate limit cannot become neutral findings`,async({page})=>{
    await page.setViewportSize({width,height:900})
    const report=current({...empty,schema:'xorus_analysis/v2',input_provenance:'no_usable_provider_input',
      collection:{...collected.collection,state:'rate_limited',candles_used:0,payload_sha256:null}})
    await page.route('https://analysis-api.invalid/v1/xorus/analysis',route=>route.fulfill({headers,json:{ok:true,report}}))
    await page.route('https://api.multiversx.com/economics*',route=>route.fulfill({status:503}))
    await page.goto(`/intelligence/xorus/?lang=${lang}`,{waitUntil:'domcontentloaded'})
    const analysis=page.getByTestId('xorus-analysis-report')
    await expect(analysis).toContainText(lang==='fr'?'Source temporairement limitée':'Source temporarily rate limited')
    await expect(analysis).toContainText(lang==='fr'?'Aucune entrée exploitable':'No usable inputs')
    await expect(analysis).not.toContainText(lang==='fr'?'indicateurs équilibrés':'balanced indicators')
  })
}

test('xOrus browser retries one transient 503 after Render wake-up, with no offline substitution',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  let attempts=0,legacyRequests=0
  await page.route('**/data/xorus_analysis_preview.json',route=>{
    legacyRequests++
    return route.abort()
  })
  await page.route('https://analysis-api.invalid/v1/xorus/analysis',route=>{
    attempts++
    return attempts===1
      ? route.fulfill({status:503,headers,json:{ok:false,error:'analysis_unavailable'}})
      : route.fulfill({headers,json:{ok:true,report:current(collected)}})
  })
  await page.route('https://api.multiversx.com/economics*',route=>route.fulfill({status:503}))
  await page.goto('/intelligence/lab/?lang=fr',{waitUntil:'domcontentloaded'})
  const desk=page.getByTestId('xorus-decision-desk')
  await expect(desk).toContainText('Analyse calculée sur 6 indicateurs',{timeout:10000})
  await expect(desk).toContainText('Binance Spot · EGLD/USDT')
  expect(attempts).toBe(2)
  expect(legacyRequests).toBe(0)
  await expect(desk).toContainText('S’ABSTENIR')
})
