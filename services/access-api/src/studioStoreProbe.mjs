/** Public dependency status: schema metadata only, never artist rows or Pinata calls.
 * The HTTP response intentionally keeps the legacy boolean-only shape.
 * Operator logs record ONLY a fixed reason code, never SQL errors, endpoints,
 * IPFS CIDs, wallet addresses or credential-bearing connection strings.
 */
import {inspectStudioDatabase} from './studioPreflight.mjs'

const SAFE_REASONS=new Set([
  'verified','database_url_missing','migration_004_missing',
  'migration_006_missing','studio_schema_incomplete','database_probe_failed',
])
function safeReason(schema){
  if(schema?.ready===true)return 'verified'
  return SAFE_REASONS.has(schema?.reason)?schema.reason:'studio_schema_incomplete'
}
function defaultReport(value){console.info('[xArtists studio-store] '+value)}
export function createStudioStoreProbe({env=process.env,inspect=inspectStudioDatabase,
  now=Date.now,cacheMs=30000,report=defaultReport}={}){
  let cached=null,inFlight=null,lastReported=null
  return async()=>{
    if(cached&&now()<cached.until)return cached.result
    if(inFlight)return inFlight
    inFlight=(async()=>{
      const backend=String(env.DATABASE_URL||'').trim()?'postgres':'unconfigured'
      let schema
      try{schema=await inspect({env})}
      catch{schema={ready:false,reason:'database_probe_failed'}}
      const reason=safeReason(schema)
      const marker=backend+':'+reason
      // Once per state transition; no user-supplied text in the audit trail.
      if(marker!==lastReported){
        lastReported=marker
        try{report('backend='+backend+' reason='+reason)}catch{/* logging must not fail readiness */}
      }
      return {ok:schema?.ready===true,backend,table_ready:schema?.tableReady===true,
        schema_ready:schema?.ready===true,model_schema_ready:schema?.modelReady===true}
    })().then(result=>{
      cached={result,until:now()+cacheMs}
      return result
    }).finally(()=>{inFlight=null})
    return inFlight
  }
}
export const probeStudioStore=createStudioStoreProbe()
