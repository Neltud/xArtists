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
const response=data=>({ok:true,json:async()=>data})
const compiled=buildSync({
  entryPoints:[new URL('../src/components/intelligence/XorusDecisionDesk.tsx',import.meta.url).pathname],
  bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',logLevel:'silent',
  define:{'import.meta.env':JSON.stringify({BASE_URL:'/'})},
  external:['react','react/jsx-runtime','react-router-dom','../../i18n/I18nContext'],
})
const module={exports:{}}
new Function('require','module','exports',compiled.outputFiles[0].text)(id=>
  id==='../../i18n/I18nContext'?{useI18n:()=>({lang:'fr'})}:
    id==='react-router-dom'?{Link:({to,children,...props})=>React.createElement('a',{href:to,...props},children)}:require(id),module,module.exports)
const Desk=module.exports.default

async function harness(report=fixture){
  const originalFetch=globalThis.fetch,originalTimer=window.setTimeout
  let expire,unavailable=false,resolveEconomics
  const economics=new Promise(resolve=>{resolveEconomics=resolve})
  window.setTimeout=(fn,delay,...args)=>delay===10000?(expire=fn,12345):originalTimer.call(window,fn,delay,...args)
  globalThis.fetch=async url=>{
    if(url.includes('/economics'))return economics
    if(url.endsWith('xorus_board.json'))return response(paper)
    if(url.endsWith('xorus_analysis_preview.json'))return unavailable?{ok:false}:response(report)
    assert.fail('unexpected source '+url)
  }
  const host=document.createElement('div');document.body.append(host)
  const root=createRoot(host)
  await React.act(async()=>root.render(React.createElement(Desk)))
  return {host,
    panel:()=>host.querySelector('[data-testid=xorus-analysis-report]'),
    button:()=>host.querySelector('button'),
    expire:()=>React.act(async()=>expire()),
    removeReport:()=>{unavailable=true},
    resolveQuote:data=>React.act(async()=>resolveEconomics(response(data))),
    close:async()=>{
      await React.act(async()=>root.unmount())
      host.remove();globalThis.fetch=originalFetch;window.setTimeout=originalTimer
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
