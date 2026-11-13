/** Public code identity reported by the hosting environment, never a release gate. */
const SHA=/^[0-9a-f]{40}$/

export function createRuntimeBuildInfo({env=process.env,startedAt=new Date().toISOString()}={}){
  if(typeof startedAt!=='string'||!Number.isFinite(Date.parse(startedAt))||
    new Date(startedAt).toISOString()!==startedAt)throw Error('invalid_runtime_start_time')
  const render=env.RENDER_GIT_COMMIT,operator=env.XARTISTS_SOURCE_SHA
  const renderPresent=typeof render==='string'&&render!==''
  const operatorPresent=typeof operator==='string'&&operator!==''
  let source=null,origin='unavailable'
  if(renderPresent){
    if(SHA.test(render)&&(!operatorPresent||operator===render)){source=render;origin='render-runtime'}
  }else if(operatorPresent&&SHA.test(operator)){
    source=operator;origin='operator-environment'
  }
  return Object.freeze({
    schema_version:1,service:'access-api',source_sha:source,stamp_source:origin,
    started_at:startedAt,execution_authorized:false,
  })
}
