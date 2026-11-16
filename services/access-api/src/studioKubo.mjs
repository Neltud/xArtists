/**
 * Self-hosted Kubo RPC, never a public / user-selected URL.
 * The only approved transport is the private Docker service alias.
 * Every file publication still requires the signed Creator Studio flow.
 */
const KUBO_RPC='http://kubo:5001'
const CID=/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{20,})$/
const fail=(code,statusCode=503)=>Object.assign(new Error(code),{statusCode})

export function kuboConfigured(env=process.env){
  return env.STUDIO_IPFS_PROVIDER==='kubo'&&env.STUDIO_KUBO_API_URL===KUBO_RPC
}

export async function checkKuboReadiness({env=process.env,request=fetch}={}){
  if(!kuboConfigured(env))return {ready:false,reason:'kubo_not_configured'}
  try{
    const response=await request(KUBO_RPC+'/api/v0/version',{
      method:'POST',redirect:'error',signal:AbortSignal.timeout(4000),
    })
    if(!response.ok)return {ready:false,reason:'kubo_not_ready'}
    const result=await response.json()
    return typeof result?.Version==='string'&&/^\d+\.\d+\.\d+/.test(result.Version)
      ? {ready:true,reason:'kubo_rpc_verified'}
      : {ready:false,reason:'kubo_invalid_response'}
  }catch{return {ready:false,reason:'kubo_unreachable'}}
}

function acceptedCid(hash){
  if(typeof hash!=='string'||!CID.test(hash))throw fail('kubo_result_invalid',502)
  return hash
}
export async function kuboAddFile({buffer,filename,wrap=false,env=process.env,request=fetch}){
  if(!kuboConfigured(env))throw fail('kubo_not_configured')
  if(!Buffer.isBuffer(buffer)||buffer.length===0||buffer.length>48*1024*1024)
    throw fail('kubo_file_invalid',413)
  if(typeof filename!=='string'||!/^[-a-z0-9]+\.(?:jpg|png|webp|mp4|mp3|wav|flac|glb|json)$/.test(filename))
    throw fail('kubo_filename_invalid',400)
  const fd=new FormData()
  fd.append('file',new Blob([buffer]),filename)
  const query=new URLSearchParams({'cid-version':'1','pin':'true','wrap-with-directory':String(wrap)})
  let response
  try{
    response=await request(KUBO_RPC+'/api/v0/add?'+query.toString(),{
      method:'POST',redirect:'error',body:fd,signal:AbortSignal.timeout(120000),
    })
  }catch{throw fail('kubo_service_unavailable')}
  if(!response.ok)throw fail('kubo_add_failed',502)
  let content
  try{content=await response.text()}catch{throw fail('kubo_result_invalid',502)}
  if(content.length>16384)throw fail('kubo_result_invalid',502)
  let rows
  try{rows=content.trim().split(/\r?\n/).map(x=>JSON.parse(x))}
  catch{throw fail('kubo_result_invalid',502)}
  const files=rows.filter(row=>row&&row.Name===filename)
  const roots=rows.filter(row=>row&&row.Name==='')
  if(files.length!==1||(wrap?roots.length!==1||rows.length!==2:roots.length!==0||rows.length!==1))
    throw fail('kubo_result_invalid',502)
  acceptedCid(files[0].Hash)
  return acceptedCid(wrap?roots[0].Hash:files[0].Hash)
}
