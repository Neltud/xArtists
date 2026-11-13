import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {buildSync} from 'esbuild'
import {Window} from 'happy-dom'

const window=new Window({url:'https://xartists.art/intelligence/xorus/'})
for(const key of ['window','document','navigator','HTMLElement','Node']){
  Object.defineProperty(globalThis,key,{value:key==='window'?window:window[key],configurable:true})
}
globalThis.IS_REACT_ACT_ENVIRONMENT=true
const React=await import('react')
const {createRoot}=await import('react-dom/client')
const require=createRequire(import.meta.url)
const fixture=JSON.parse(readFileSync(new URL('../public/data/xorus_analysis_preview.json',import.meta.url),'utf8'))
const paper=JSON.parse(readFileSync(new URL('../public/data/xorus_board.json',import.meta.url),'utf8'))
const collected=JSON.parse(readFileSync(new URL('../../../tests/fixtures/xorus_analysis_collected.json',import.meta.url),'utf8'))
const response=data=>({ok:true,json:async()=>data})
function compileDesk(apiBase=''){
const compiled=buildSync({
  entryPoints:[new URL('../src/components/intelligence/XorusDecisionDesk.tsx',import.meta.url).pathname],
  bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',logLevel:'silent',
  define:{'import.meta.env':JSON.stringify({BASE_URL:'/',VITE_ACCESS_API_BASE:apiBase})},
  external:['react','react/jsx-runtime','react-router-dom','../../i18n/I18nContext'],
})
const module={exports:{}}
new Function('require','module','exports',compiled.outputFiles[0].text)(id=>
  id==='../../i18n/I18nContext'?{useI18n:()=>({lang:'fr'})}:
    id==='react-router-dom'?{Link:({to,children,...props})=>React.createElement('a',{href:to,...props},children)}:require(id),module,module.exports)
return module.exports.default
}
const Desk=compileDesk()
const ServerDesk=compileDesk('https://analysis-api.test')

async function harness(report=fixture,{server=false,transientOnce=false,deniedStatus=null}={}){
  const originalFetch=globalThis.fetch,originalTimer=window.setTimeout,originalInterval=window.setInterval
  let expire,ageTick,unavailable=false,resolveEconomics,firstTransient=transientOnce
  const economics=new Promise(resolve=>{resolveEconomics=resolve})
  const requested=[]
  window.setTimeout=(fn,delay,...args)=>(delay===10000||delay===20000)?(expire=fn,12345):originalTimer.call(window,fn,delay,...args)
  window.setInterval=(fn,delay,...args)=>delay===30000?(ageTick=fn,12346):originalInterval.call(window,fn,delay,...args)
  globalThis.fetch=async url=>{
    requested.push(url)
    if(url.includes('/economics'))return economics
    if(url.endsWith('xorus_board.json'))return response(paper)
    if(url.endsWith('xorus_analysis_preview.json'))return unavailable?{ok:false}:response(report)
    if(url==='https://analysis-api.test/v1/xorus/analysis'){
      if(firstTransient){firstTransient=false;return {ok:false,status:503}}
      if(deniedStatus!==null)return {ok:false,status:deniedStatus}
      return unavailable?{ok:false,status:403}:response({ok:true,report})
    }
    assert.fail('unexpected source '+url)
  }
  const host=document.createElement('div');document.body.append(host)
  const root=createRoot(host)
  await React.act(async()=>root.render(React.createElement(server?ServerDesk:Desk)))
  return {host,requested,
    panel:()=>host.querySelector('[data-testid=xorus-analysis-report]'),
    button:()=>host.querySelector('button'),
    expire:()=>React.act(async()=>expire()),
    age:()=>React.act(async()=>ageTick()),
    removeReport:()=>{unavailable=true},
    resolveQuote:data=>React.act(async()=>resolveEconomics(response(data))),
    close:async()=>{
      await React.act(async()=>root.unmount())
      host.remove();globalThis.fetch=originalFetch;window.setTimeout=originalTimer;window.setInterval=originalInterval
    },
  }
}

test('an unresponsive quote does not hold back the rendered analysis',async()=>{
  const h=await harness()
  try{
    assert.match(h.panel().textContent,/Aucune entrée exploitable/)
    assert.equal(h.panel().querySelectorAll('article').length,8)
    assert.equal(h.button().disabled,true)
    await h.expire()
    assert.equal(h.button().disabled,false)
    assert.match(h.panel().textContent,/Aucune entrée exploitable/)
    // A quote arriving after cancellation cannot repopulate the market card.
    await h.resolveQuote({price:98765.4321})
    assert.doesNotMatch(h.host.textContent,/98.?765/)
  }finally{await h.close()}
})

test('refresh failure removes previously rendered findings without fallback',async()=>{
  const report=structuredClone(fixture)
  report.coverage.signals_analyzed=1
  report.coverage.families_analyzed=1
  report.agents[1].status='paper_unverified'
  report.agents[1].families[0]={family:'price',signals_analyzed:1,reading:'negative'}
  report.provider_payload='private-provider-secret'
  const h=await harness(report)
  try{
    assert.match(h.panel().textContent,/lecture négative/)
    assert.doesNotMatch(h.host.textContent,/private-provider-secret/)
    await h.expire()
    h.removeReport()
    await React.act(async()=>h.button().click())
    assert.match(h.panel().textContent,/Rapport indisponible ou non conforme/)
    assert.doesNotMatch(h.panel().textContent,/lecture négative/)
    await h.expire()
    assert.match(h.panel().textContent,/Rapport indisponible ou non conforme/)
  }finally{await h.close()}
})

test('a report claiming raw data delivery never renders analysis findings',async()=>{
  const h=await harness({...fixture,raw_data_included:true})
  try{
    assert.match(h.panel().textContent,/Rapport indisponible ou non conforme/)
    assert.equal(h.panel().querySelectorAll('article').length,0)
    assert.match(h.host.textContent,/S’ABSTENIR/)
  }finally{await h.close()}
})

test('configured server renders derived analysis and source time before a hung quote',async()=>{
  const report=structuredClone(collected)
  report.generated_at=new Date().toISOString().slice(0,19)+'Z'
  report.collection.received_at=report.generated_at
  report.source_ts=new Date(Math.floor(Date.now()/3600000)*3600000-1000).toISOString().slice(0,19)+'Z'
  report.provider_payload='private-server-response'
  const h=await harness(report,{server:true})
  try{
    assert.match(h.panel().textContent,/Source consultée : Binance Spot · EGLD\/USDT/)
    assert.match(h.panel().textContent,/Observations clôturées le/)
    assert.match(h.host.textContent,/Analyse calculée sur 6 indicateurs/)
    assert.doesNotMatch(h.host.textContent,/private-server-response/)
    assert.equal(h.requested.some(url=>url.includes('xorus_analysis_preview.json')),false)
    await h.expire()
    h.removeReport()
    await React.act(async()=>h.button().click())
    assert.match(h.panel().textContent,/Rapport indisponible ou non conforme/)
    assert.doesNotMatch(h.panel().textContent,/lecture positive|lecture négative|indicateurs contradictoires/)
    assert.equal(h.requested.some(url=>url.includes('xorus_analysis_preview.json')),false)
  }finally{await h.close()}
})


test('configured xOrus server retries a transient 503 once, without a static fallback',async()=>{
  const report=structuredClone(collected)
  report.generated_at=new Date().toISOString().slice(0,19)+'Z'
  report.collection.received_at=report.generated_at
  report.source_ts=new Date(Math.floor(Date.now()/3600000)*3600000-1000).toISOString().slice(0,19)+'Z'
  const h=await harness(report,{server:true,transientOnce:true})
  try{
    await React.act(async()=>new Promise(resolve=>setTimeout(resolve,850)))
    assert.match(h.panel().textContent,/Source consultée : Binance Spot · EGLD\/USDT/)
    const apiReads=h.requested.filter(url=>url==='https://analysis-api.test/v1/xorus/analysis')
    assert.equal(apiReads.length,2,'exactly one retry after a temporary 503')
    assert.equal(h.requested.some(url=>url.includes('xorus_analysis_preview.json')),false)
  }finally{await h.close()}
})

test('configured xOrus server never retries a forbidden or rate-limited API response',async()=>{
  for(const deniedStatus of [401,403,429]){
    const h=await harness(collected,{server:true,deniedStatus})
    try{
      assert.match(h.panel().textContent,/Rapport indisponible ou non conforme/)
      assert.equal(h.requested.filter(url=>url==='https://analysis-api.test/v1/xorus/analysis').length,1)
      assert.equal(h.requested.some(url=>url.includes('xorus_analysis_preview.json')),false)
    }finally{await h.close()}
  }
})

test('configured server cannot substitute the legacy offline preview',async()=>{
  const h=await harness(fixture,{server:true})
  try{
    assert.match(h.panel().textContent,/Rapport indisponible ou non conforme/)
    assert.equal(h.panel().querySelectorAll('article').length,0)
    assert.equal(h.requested.some(url=>url.includes('xorus_analysis_preview.json')),false)
  }finally{await h.close()}
})

test('aging an analysis never pretends the quote provider was consulted again',async()=>{
  const originalNow=Date.now
  let now=originalNow()
  Date.now=()=>now
  const report=structuredClone(collected)
  report.generated_at=new Date(now).toISOString().slice(0,19)+'Z'
  report.collection.received_at=report.generated_at
  report.source_ts=new Date(Math.floor(now/3600000)*3600000-1000).toISOString().slice(0,19)+'Z'
  const h=await harness(report,{server:true})
  try{
    await h.resolveQuote({price:2.5})
    const checked=h.host.querySelector('[data-testid=xorus-quote-checked-at]').textContent
    const requests=h.requested.length
    now+=16*60000
    await h.age()
    assert.match(h.panel().textContent,/HISTORIQUE/)
    assert.equal(h.host.querySelector('[data-testid=xorus-quote-checked-at]').textContent,checked)
    assert.equal(h.requested.length,requests)
  }finally{await h.close();Date.now=originalNow}
})
