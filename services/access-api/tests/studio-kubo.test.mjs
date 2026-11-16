import assert from 'node:assert/strict'
import {test} from 'node:test'
import {readFileSync} from 'node:fs'
import {kuboConfigured,checkKuboReadiness,kuboAddFile} from '../src/studioKubo.mjs'
import {studioMediaConfig} from '../src/creatorMedia.mjs'

const env={STUDIO_IPFS_PROVIDER:'kubo',STUDIO_KUBO_API_URL:'http://kubo:5001'}
const cid='bafy'+'a'.repeat(40)
const dir='bafy'+'b'.repeat(40)
const response=body=>({ok:true,text:async()=>body,json:async()=>({Version:'0.43.1'})})

test('Kubo opt-in accepts ONLY the fixed private Docker RPC, never a user-supplied URL',()=>{
  assert.equal(kuboConfigured({}),false)
  assert.equal(kuboConfigured(env),true)
  for(const url of ['http://127.0.0.1:5001','https://kubo:5001','http://kubo:5001/','http://kubo:5001@evil.example','http://localhost:5001','http://kubo:5001/api/v0/add']){
    assert.equal(kuboConfigured({...env,STUDIO_KUBO_API_URL:url}),false,url)
  }
  const common={...env,CREATOR_MEDIA_UPLOAD_ENABLED:'1',DATABASE_URL:'postgres://fake',
    ACCESS_JWT_SECRET:'verified-signing-key-placeholder-long'}
  assert.equal(studioMediaConfig(common).enabled,true)
  assert.equal(studioMediaConfig(common).provider,'kubo_ipfs')
  assert.equal(studioMediaConfig({...common,DATABASE_URL:''}).enabled,false)
  assert.equal(studioMediaConfig({...common,CREATOR_MEDIA_UPLOAD_ENABLED:'0'}).enabled,false)
  assert.equal(studioMediaConfig({...common,STUDIO_KUBO_API_URL:'http://evil.example'}).enabled,false)
  assert.equal(studioMediaConfig({...common,STUDIO_IPFS_PROVIDER:'unknown',PINATA_JWT:'x'.repeat(80)}).enabled,false)
  assert.equal(studioMediaConfig({...common,STUDIO_IPFS_PROVIDER:'pinata',PINATA_JWT:''}).enabled,false)
})

test('read-only Kubo readiness uses POST version on the private RPC only',async()=>{
  const calls=[]
  const ok=await checkKuboReadiness({env,request:async(url,init)=>{
    calls.push({url,init});return response('')
  }})
  assert.deepEqual(ok,{ready:true,reason:'kubo_rpc_verified'})
  assert.equal(calls.length,1)
  assert.equal(calls[0].url,'http://kubo:5001/api/v0/version')
  assert.equal(calls[0].init.method,'POST')
  assert.equal(calls[0].init.redirect,'error')
  assert.deepEqual(await checkKuboReadiness({env:{},request:async()=>{throw Error('must not call')}}),
    {ready:false,reason:'kubo_not_configured'})
  assert.equal((await checkKuboReadiness({env,request:async()=>{throw Error('unreachable')}})).ready,false)
  assert.equal((await checkKuboReadiness({env,request:async()=>({ok:true,json:async()=>({})})})).ready,false)
})

test('Kubo media CID must come from one file plus the wrapped directory',async()=>{
  const file='artwork-123abc.png'
  const replies=[
    {Name:file,Hash:cid,Size:'123'},
    {Name:'',Hash:dir,Size:'456'},
  ]
  const calls=[]
  const result=await kuboAddFile({buffer:Buffer.from('fixture-not-a-real-image'),filename:file,
    wrap:true,env,request:async(url,init)=>{
      calls.push({url,init});return response(replies.map(x=>JSON.stringify(x)).join('\n')+'\n')
    }})
  assert.equal(result,dir)
  assert.equal(calls.length,1)
  assert.equal(calls[0].init.method,'POST')
  assert.equal(calls[0].init.redirect,'error')
  assert.equal(calls[0].init.body.get('file').name,file)
  const url=new URL(calls[0].url)
  assert.equal(url.origin,'http://kubo:5001')
  assert.equal(url.pathname,'/api/v0/add')
  assert.equal(url.searchParams.get('pin'),'true')
  assert.equal(url.searchParams.get('cid-version'),'1')
  assert.equal(url.searchParams.get('wrap-with-directory'),'true')
})

test('immutable metadata CID is a single object without a directory wrapper',async()=>{
  const file='metadata-aaa-bbb.json'
  const result=await kuboAddFile({buffer:Buffer.from('{"ok":true}'),filename:file,env,
    request:async(url)=>{assert.equal(new URL(url).searchParams.get('wrap-with-directory'),'false')
      return response(JSON.stringify({Name:file,Hash:cid,Size:'11'})+'\n')}})
  assert.equal(result,cid)
})

test('invalid CID, missing directory, mismatched filename and provider errors fail closed',async()=>{
  const file='artwork-abc123.mp3',data=Buffer.from('sample')
  const failBody=async body=>assert.rejects(
    kuboAddFile({buffer:data,filename:file,wrap:true,env,request:async()=>response(body)}),
    /kubo_result_invalid/,
  )
  await failBody(JSON.stringify({Name:file,Hash:cid})+'\n')
  await failBody(JSON.stringify({Name:file,Hash:'https://untrusted.example'})+'\n'+JSON.stringify({Name:'',Hash:dir}))
  await failBody(JSON.stringify({Name:'other.mp3',Hash:cid})+'\n'+JSON.stringify({Name:'',Hash:dir}))
  await failBody('{bad json')
  await failBody('x'.repeat(16385))
  await assert.rejects(kuboAddFile({buffer:data,filename:'../../etc/passwd',env,request:async()=>response('')}),
    /kubo_filename_invalid/)
  await assert.rejects(kuboAddFile({buffer:data,filename:file,env,
    request:async()=>({ok:false})}),/kubo_add_failed/)
  await assert.rejects(kuboAddFile({buffer:data,filename:file,env,
    request:async()=>{throw Error('internal hostname or credentials must not be leaked')}}),
    /kubo_service_unavailable/)
})

test('optional OVH compose overlay never publishes privileged RPC or forces a live upload',()=>{
  const overlay=readFileSync(new URL('../../../deploy/ovh/compose.ipfs.yaml',import.meta.url),'utf8')
  const base=readFileSync(new URL('../../../deploy/ovh/compose.yaml',import.meta.url),'utf8')
  assert.match(overlay,/STUDIO_IPFS_PROVIDER: kubo/)
  assert.match(overlay,/STUDIO_KUBO_API_URL: http:\/\/kubo:5001/)
  assert.match(overlay,/XARTISTS_KUBO_IMAGE/)
  assert.match(overlay,/XARTISTS_KUBO_DATA_DIR/)
  assert.match(overlay,/ipfs_rpc/)
  assert.doesNotMatch(overlay,/ports:\s*\n\s*-\s*["']?5001/)
  assert.doesNotMatch(overlay,/ports:\s*\n\s*-\s*["']?8080/)
  assert.match(base,/XARTISTS_STUDIO_UPLOAD_APPROVED:-0/)
})
