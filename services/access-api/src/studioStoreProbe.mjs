/** Public dependency status: schema metadata only, never artist rows or Pinata calls. */
import {inspectStudioDatabase} from './studioPreflight.mjs'

export function createStudioStoreProbe({env=process.env,inspect=inspectStudioDatabase,
  now=Date.now,cacheMs=30000}={}){
  let cached=null,inFlight=null
  return async()=>{
    if(cached&&now()<cached.until)return cached.result
    if(inFlight)return inFlight
    inFlight=(async()=>{
      const backend=String(env.DATABASE_URL||'').trim()?'postgres':'unconfigured'
      try{
        const schema=await inspect({env})
        return {ok:schema.ready===true,backend,table_ready:schema.tableReady===true,
          schema_ready:schema.ready===true,model_schema_ready:schema.modelReady===true}
      }catch{
        return {ok:false,backend,table_ready:false,schema_ready:false,model_schema_ready:false}
      }
    })().then(result=>{
      cached={result,until:now()+cacheMs}
      return result
    }).finally(()=>{inFlight=null})
    return inFlight
  }
}
export const probeStudioStore=createStudioStoreProbe()
