/** Bounded read-only Python analysis worker, shared contract and coalesced cache. */
import {spawn} from 'node:child_process'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import {interpretXorusAnalysisReport,projectXorusAnalysisReport} from '../../../packages/core/src/xorusAnalysisContract.mjs'

const ROOT=fileURLToPath(new URL('../../../',import.meta.url))
const MAX_OUTPUT=32768
const unavailable=()=>({ok:false,error:'analysis_unavailable'})
const canonical=value=>Array.isArray(value)?value.map(canonical):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value

function workerEnvironment(env){
  const allowed=['PATH','LANG','LC_ALL','HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','NO_PROXY',
    'http_proxy','https_proxy','all_proxy','no_proxy','SSL_CERT_FILE','SSL_CERT_DIR']
  return {...Object.fromEntries(allowed.filter(key=>typeof env[key]==='string').map(key=>[key,env[key]])),
    LIA_LIVE_TRADING:'0',PYTHONDONTWRITEBYTECODE:'1'}
}

export function runPythonAnalysis({spawnImpl=spawn,env=process.env,timeoutMs=8000}={}){
  return new Promise(resolve=>{
    let child,timer,done=false,size=0
    const chunks=[]
    const finish=value=>{
      if(done)return
      done=true;clearTimeout(timer);resolve(value)
    }
    try{
      // Fixed binary/module and no shell or HTTP-supplied arguments.
      child=spawnImpl('python3',['-S','-B','-m','lia.xorus.analysis_cycle'],{
        cwd:ROOT,env:workerEnvironment(env),stdio:['ignore','pipe','ignore'],shell:false,
      })
      timer=setTimeout(()=>{child.kill('SIGKILL');finish(null)},timeoutMs)
      child.once('error',()=>finish(null))
      child.stdout.on('data',chunk=>{
        size+=chunk.length
        if(size>MAX_OUTPUT){child.kill('SIGKILL');finish(null)}
        else if(!done)chunks.push(chunk)
      })
      child.once('close',code=>{
        if(code!==0)return finish(null)
        try{finish(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch{finish(null)}
      })
    }catch{finish(null)}
  })
}

export function createXorusAnalysisService({runCycle=runPythonAnalysis,clock=Date.now,enabled=true}={}){
  let cached=null,expires=0,pending=null
  return Object.freeze({
    async read(){
      if(!enabled)return {ok:false,error:'analysis_disabled'}
      const now=clock()
      if(!Number.isFinite(now))return unavailable()
      if(cached&&now<expires)return structuredClone(cached)
      if(pending)return structuredClone(await pending)
      pending=(async()=>{
        let result=unavailable(),ttl=60000
        try{
          const raw=await runCycle()
          const completed=clock()
          const report=raw?.schema==='xorus_analysis/v2'?projectXorusAnalysisReport(raw,completed):null
          if(report){
            const {report_sha256,...unsigned}=report
            const digest=createHash('sha256').update(JSON.stringify(canonical(unsigned))).digest('hex')
            const readout=interpretXorusAnalysisReport(report,completed)
            // No stale success, substituted output or privileged/raw-data claim.
            if(digest===report_sha256&&!readout.stale){
              result={ok:true,report}
              ttl=report.collection.state==='observed'
                ? Math.min(60000,Date.parse(report.source_ts)+3901000-completed)
                : report.collection.retry_after_seconds*1000
            }
          }
        }catch{/* The error text may contain provider data: never return it. */}
        cached=result;expires=clock()+Math.max(0,ttl)
        return result
      })()
      try{return structuredClone(await pending)}finally{pending=null}
    },
  })
}
