import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {buildSync} from 'esbuild'
import {Window} from 'happy-dom'

const window=new Window({url:'https://xartists.art/intelligence/agents/'})
for(const key of ['window','document','navigator','HTMLElement','Node']){
  Object.defineProperty(globalThis,key,{value:key==='window'?window:window[key],configurable:true})
}
globalThis.IS_REACT_ACT_ENVIRONMENT=true
const React=await import('react')
const {createRoot}=await import('react-dom/client')
const require=createRequire(import.meta.url)
const fixture=JSON.parse(readFileSync(new URL('../../../tests/fixtures/xorus_analysis_collected.json',import.meta.url),'utf8'))

function compile(base){
  const compiled=buildSync({
    entryPoints:[new URL('../src/components/intelligence/XorusAgentEvidence.tsx',import.meta.url).pathname],
    bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',logLevel:'silent',
    define:{'import.meta.env':JSON.stringify({BASE_URL:'/',VITE_ACCESS_API_BASE:base})},
    external:['react','react/jsx-runtime','react-router-dom','../../i18n/I18nContext'],
  })
  const mod={exports:{}}
  new Function('require','module','exports',compiled.outputFiles[0].text)(id=>
    id==='../../i18n/I18nContext'?{useI18n:()=>({lang:'fr'})}:
      id==='react-router-dom'?{Link:({to,children,...props})=>React.createElement('a',{href:to,...props},children)}:
        require(id),mod,mod.exports)
  return mod.exports.default
}
const Server=compile('https://analysis-api.test')
const NoApi=compile('')

function fresh(){
  const obj=structuredClone(fixture)
  const now=Date.now()
  obj.generated_at=new Date(now).toISOString().slice(0,19)+'Z'
  obj.collection.received_at=obj.generated_at
  obj.source_ts=new Date(Math.floor(now/3600000)*3600000-1000).toISOString().slice(0,19)+'Z'
  return obj
}
async function harness({report=fresh(),base=true,status=200}={}){
  const original=globalThis.fetch
  const requested=[]
  globalThis.fetch=async(url,config)=>{
    requested.push({url,config})
    if(url!=='https://analysis-api.test/v1/xorus/analysis')
      throw Error('unexpected public API / forbidden static preview request')
    return {ok:status===200,status,json:async()=>({ok:true,report})}
  }
  const host=document.createElement('div');document.body.append(host)
  const root=createRoot(host)
  await React.act(async()=>root.render(React.createElement(base?Server:NoApi)))
  return {host,requested,close:async()=>{
    await React.act(async()=>root.unmount())
    host.remove();globalThis.fetch=original
  }}
}
test('agent page shows genuine timestamped paper coverage, never a paid report',async()=>{
  const h=await harness()
  try{
    assert.equal(h.requested.length,1)
    assert.equal(h.requested[0].url,'https://analysis-api.test/v1/xorus/analysis')
    assert.match(h.host.textContent,/Rapport serveur validé dans son format/)
    assert.match(h.host.textContent,/ABSTAIN/)
    assert.match(h.host.textContent,/Indicateurs calculés6 \/ 12/)
    assert.match(h.host.textContent,/Familles analysées3 \/ 3/)
    assert.equal(h.host.querySelector('[data-testid=xorus-verified]').textContent,'0')
    assert.match(h.host.querySelector('[data-testid=xorus-track-pulse]').textContent,/5 indicateur/)
    assert.match(h.host.querySelector('[data-testid=xorus-track-yield]').textContent,/Aucun indicateur exploitable/)
    assert.match(h.host.querySelector('[data-testid=xorus-track-sentinel]').textContent,/1 indicateur/)
    assert.equal(h.host.querySelectorAll('[data-testid^=xorus-role-]').length,8)
    assert.match(h.host.textContent,/les droits commerciaux de cette source ne sont pas certifiés/)
    assert.doesNotMatch(h.host.textContent,/Accès activé|Acheter maintenant|LIVE trading|APY garanti/)
    assert.equal(h.requested.filter(x=>x.url.includes('preview.json')).length,0)
  }finally{await h.close()}
})
test('missing API configuration and HTTP 503 do not silently publish synthetic signals',async()=>{
  const a=await harness({base:false})
  try{
    assert.equal(a.requested.length,0)
    assert.match(a.host.textContent,/Analyse serveur indisponible/)
    assert.equal(a.host.querySelectorAll('[data-testid^=xorus-role-]').length,0)
  }finally{await a.close()}
  const b=await harness({status:503})
  try{
    assert.equal(b.requested.length,1)
    assert.match(b.host.textContent,/Analyse serveur indisponible/)
    assert.equal(b.host.querySelectorAll('[data-testid^=xorus-role-]').length,0)
  }finally{await b.close()}
})
test('commercially flagged, raw-data or forged verification responses cannot be displayed',async()=>{
  const cases=[
    {...fresh(),raw_data_included:true},
    {...fresh(),commercial_enabled:true},
    {...fresh(),coverage:{...fresh().coverage,independently_verified_signals:120}},
    {...fresh(),decision:{stance:'BUY',reason:'thin_tape'}},
  ]
  for(const report of cases){
    const h=await harness({report})
    try{
      assert.match(h.host.textContent,/Analyse serveur indisponible/)
      assert.equal(h.host.querySelectorAll('[data-testid^=xorus-role-]').length,0)
      assert.equal(h.host.querySelector('[data-testid=xorus-verified]'),null)
    }finally{await h.close()}
  }
})
test('provider payloads and arbitrary content do not appear in the public role readout',async()=>{
  const report=fresh()
  report.private_payload='opaque-provider-secret-test'
  report.agents[0].provider_payload='secret-in-agent-test'
  report.agents[0].families[0].interpretation='send money to secret.test'
  const h=await harness({report})
  try{
    assert.match(h.host.textContent,/ABSTAIN/)
    assert.doesNotMatch(h.host.textContent,/opaque-provider|secret-in-agent|send money/)
  }finally{await h.close()}
})
test('historical valid report is labelled stale and cannot be presented as live coverage',async()=>{
  const report=fresh()
  report.generated_at=new Date(Date.now()-22*60000).toISOString().slice(0,19)+'Z'
  report.collection.received_at=report.generated_at
  report.source_ts=new Date(Date.parse(report.generated_at)-30*60000).toISOString().slice(0,19)+'Z'
  const h=await harness({report})
  try{
    assert.match(h.host.textContent,/Rapport historique/)
    assert.match(h.host.querySelector('[data-testid=xorus-track-pulse]').textContent,
      /Couverture indisponible ou historique/)
    assert.equal(h.host.querySelector('[data-testid=xorus-verified]').textContent,'0')
  }finally{await h.close()}
})
test('page mount keeps Genesis NFT catalogue separate from actual agent analysis',()=>{
  const page=readFileSync(new URL('../src/pages/Agents.tsx',import.meta.url),'utf8')
  assert.match(page,/<XorusAgentEvidence \/>/)
  assert.match(page,/Catalogue Genesis NFT \(distinct des agents\)/)
  assert.ok(page.indexOf('<XorusAgentEvidence />')<page.indexOf('Catalogue Genesis NFT'))
  assert.doesNotMatch(readFileSync(new URL('../src/components/intelligence/XorusAgentEvidence.tsx',import.meta.url),'utf8'),
    /buyPack\(|dispatchMint|signTransactions|sendTransaction|createCheckout|walletconnect/i)
})
