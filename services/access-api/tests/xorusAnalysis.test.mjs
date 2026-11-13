import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {EventEmitter} from 'node:events'
import {PassThrough} from 'node:stream'
import {spawn} from 'node:child_process'
import {createHash} from 'node:crypto'
import {createXorusAnalysisService,runPythonAnalysis} from '../src/xorusAnalysis.mjs'
import {projectXorusAnalysisReport} from '../../../packages/core/src/xorusAnalysisContract.mjs'
import {startServer,post} from './server-fixture.mjs'

const fixture=JSON.parse(readFileSync(new URL('../../../tests/fixtures/xorus_analysis_collected.json',import.meta.url),'utf8'))
const empty=JSON.parse(readFileSync(new URL('../../../apps/frontend/public/data/xorus_analysis_preview.json',import.meta.url),'utf8'))
const now=Date.parse(fixture.generated_at)
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'
  ?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v
const seal=raw=>{
  const {report_sha256,...unsigned}=raw
  return {...unsigned,report_sha256:createHash('sha256').update(JSON.stringify(canonical(unsigned))).digest('hex')}
}

test('Python fixture passes the exact shared API/browser contract and digest',async()=>{
  assert.deepEqual(projectXorusAnalysisReport(fixture,now),fixture)
  const service=createXorusAnalysisService({runCycle:async()=>fixture,clock:()=>now})
  assert.deepEqual(await service.read(),{ok:true,report:fixture})
})

test('concurrent clients share one worker and cannot mutate the cached report',async()=>{
  let calls=0,complete
  const service=createXorusAnalysisService({clock:()=>now,runCycle:()=>{
    calls++;return new Promise(resolve=>{complete=resolve})
  }})
  const requests=Array.from({length:25},()=>service.read())
  assert.equal(calls,1)
  complete(fixture)
  const reports=await Promise.all(requests)
  reports[0].report.agents[0].status='forged'
  assert.equal(reports[1].report.agents[0].status,'no_input')
  assert.equal((await service.read()).report.agents[0].status,'no_input')
  assert.equal(calls,1)
})

test('cache is revalidated at response time even if the provider clock advances during fan-out',async()=>{
  let time=now,calls=0
  const limited=seal({...empty,schema:'xorus_analysis/v2',generated_at:fixture.generated_at,
    input_provenance:'no_usable_provider_input',collection:{...fixture.collection,
      state:'rate_limited',candles_used:0,payload_sha256:null,retry_after_seconds:3600},
    limitations:fixture.limitations})
  const service=createXorusAnalysisService({clock:()=>time,runCycle:async()=>{calls++;return limited}})
  assert.equal((await service.read()).ok,true)
  time+=15*60000+1
  const stale=await Promise.all(Array.from({length:12},()=>service.read()))
  assert.ok(stale.every(x=>x.ok===false&&x.error==='analysis_unavailable'))
  assert.equal(calls,1,'cache backoff must remain effective after the report expires')
})

test('expired cache followed by worker failure removes prior findings and backs off',async()=>{
  let time=now,calls=0
  const service=createXorusAnalysisService({clock:()=>time,runCycle:async()=>++calls===1?fixture:null})
  assert.equal((await service.read()).ok,true)
  time+=61000
  assert.deepEqual(await service.read(),{ok:false,error:'analysis_unavailable'})
  assert.deepEqual(await service.read(),{ok:false,error:'analysis_unavailable'})
  assert.equal(calls,2)
})

test('rate-limited source returns an empty report and honors provider backoff',async()=>{
  let time=now,calls=0
  const limited=seal({...empty,schema:'xorus_analysis/v2',generated_at:fixture.generated_at,
    input_provenance:'no_usable_provider_input',collection:{...fixture.collection,
      state:'rate_limited',candles_used:0,payload_sha256:null,retry_after_seconds:1800},
    limitations:fixture.limitations})
  const service=createXorusAnalysisService({clock:()=>time,runCycle:async()=>{calls++;return limited}})
  assert.equal((await service.read()).report.coverage.signals_analyzed,0)
  time+=14*60000
  assert.equal((await service.read()).report.collection.state,'rate_limited')
  assert.equal(calls,1)
  // The provider cooldown is 30 minutes, but report validity is 15 minutes.
  // Between those cutoffs the API must deny, NOT return a stale HTTP 200.
  time+=2*60000
  assert.deepEqual(await service.read(),{ok:false,error:'analysis_unavailable'})
  assert.deepEqual(await service.read(),{ok:false,error:'analysis_unavailable'})
  assert.equal(calls,1,'provider backoff remains in force; no premature network retry')
  // After the provider backoff expires, a failed refresh may not reuse the report.
  time+=14*60000+1000
  assert.equal((await service.read()).ok,false)
  assert.equal(calls,2)
})

test('stale, mutated, raw, privileged and unknown output cannot leave the API',async()=>{
  for(const raw of [null,empty,{...fixture,raw_data_included:true},
    {...fixture,commercial_enabled:true},{...fixture,access_granted:true},
    {...fixture,provider_payload:'private-provider-secret'},
    {...fixture,decision:{stance:'BUY',reason:'thin_tape'}},
    {...fixture,report_sha256:'0'.repeat(64)},
    {...fixture,safety:{...fixture.safety,executable:true}},
  ]){
    const service=createXorusAnalysisService({clock:()=>now,runCycle:async()=>raw})
    const out=await service.read()
    // Unknown keys are stripped; adding unsigned data cannot alter the report.
    if(raw?.provider_payload)assert.deepEqual(out,{ok:true,report:fixture})
    else assert.deepEqual(out,{ok:false,error:'analysis_unavailable'})
    assert.ok(!JSON.stringify(out).includes('private-provider-secret'))
  }
  const stale=createXorusAnalysisService({clock:()=>now+16*60000,runCycle:async()=>fixture})
  assert.equal((await stale.read()).ok,false)
})

test('disabled service cannot start a worker; invalid clock and exceptions are generic',async()=>{
  const disabled=createXorusAnalysisService({enabled:false,runCycle:()=>assert.fail('worker started')})
  assert.deepEqual(await disabled.read(),{ok:false,error:'analysis_disabled'})
  const invalid=createXorusAnalysisService({clock:()=>NaN,runCycle:()=>assert.fail('worker started')})
  assert.equal((await invalid.read()).ok,false)
  const broken=createXorusAnalysisService({runCycle:()=>{throw Error('private-payload-secret')}})
  assert.deepEqual(await broken.read(),{ok:false,error:'analysis_unavailable'})
})

function fakeChild(){
  const child=new EventEmitter();child.stdout=new PassThrough();child.kills=[]
  child.kill=signal=>{child.kills.push(signal);child.emit('close',null);return true}
  return child
}

test('worker uses a fixed command, bounded output and a credential-free environment',async()=>{
  const child=fakeChild()
  const result=runPythonAnalysis({env:{PATH:'/usr/bin',ACCESS_JWT_SECRET:'private-secret',
    DATABASE_URL:'private-db',BINANCE_API_KEY:'private-api',LIA_LIVE_TRADING:'1'},
    spawnImpl:(command,args,options)=>{
      assert.equal(command,'python3')
      assert.deepEqual(args,['-S','-B','-m','lia.xorus.analysis_cycle'])
      assert.equal(options.shell,false)
      assert.deepEqual(options.env,{PATH:'/usr/bin',LIA_LIVE_TRADING:'0',PYTHONDONTWRITEBYTECODE:'1'})
      queueMicrotask(()=>{child.stdout.write(JSON.stringify(fixture));child.emit('close',0)})
      return child
    }})
  assert.deepEqual(await result,fixture)
})

test('worker timeout, missing runtime, oversized output and invalid JSON cannot hang or leak',async()=>{
  for(const mode of ['timeout','error','oversize','invalid','exit']){
    const child=fakeChild()
    const out=await runPythonAnalysis({timeoutMs:20,spawnImpl:()=>{
      queueMicrotask(()=>{
        if(mode==='error')child.emit('error',Error('private process path'))
        if(mode==='oversize')child.stdout.write('x'.repeat(32769))
        if(mode==='invalid'){child.stdout.write('private invalid output');child.emit('close',0)}
        if(mode==='exit')child.emit('close',1)
      })
      return child
    }})
    assert.equal(out,null,mode)
    if(['timeout','oversize'].includes(mode))assert.deepEqual(child.kills,['SIGKILL'])
  }
})

test('actual Python subprocess executes the cycle offline with no inherited credentials',async()=>{
  const script='import sys,os,json; sys.path.insert(0,"tests"); from test_xorus_analysis_cycle import body,NOW; from lia.xorus.analysis_cycle import run_analysis_cycle; assert os.getenv("ACCESS_JWT_SECRET") is None; print(json.dumps(run_analysis_cycle(fetch_bytes=body,now=NOW)))'
  const raw=await runPythonAnalysis({env:{...process.env,ACCESS_JWT_SECRET:'test-must-not-leave'},
    spawnImpl:(_command,_args,options)=>spawn('python3',['-S','-B','-c',script],options)})
  assert.deepEqual(raw,fixture)
})

test('HTTP route rejects client-selected inputs and exposes no checkout or raw data',async()=>{
  const server=await startServer({XORUS_ANALYSIS_ENABLED:'0',CORS_ORIGIN:'https://xartists.art'})
  try{
    const response=await fetch(server.base+'/v1/xorus/analysis',{headers:{Origin:'https://xartists.art'}})
    assert.equal(response.status,503)
    assert.equal(response.headers.get('cache-control'),'no-store')
    assert.equal(response.headers.get('access-control-allow-origin'),'https://xartists.art')
    assert.deepEqual(await response.json(),{ok:false,error:'analysis_disabled'})
    const injected=await fetch(server.base+'/v1/xorus/analysis?url=https://attacker.test&symbol=BTCUSDT')
    assert.equal(injected.status,400)
    const body=await post(server.base+'/v1/xorus/analysis',{market:{price:1},commercial_enabled:true})
    assert.equal(body.status,405)
  }finally{await server.close()}
})
