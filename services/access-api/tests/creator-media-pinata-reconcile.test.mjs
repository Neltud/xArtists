import assert from 'node:assert/strict'
import {test} from 'node:test'
import crypto from 'node:crypto'
import sdk from '@multiversx/sdk-core'
import {pinStudioMetadata} from '../src/creatorMedia.mjs'

const {Address}=sdk
const wallet=new Address(crypto.generateKeyPairSync('ed25519').publicKey.export({
  type:'spki',format:'der',
}).subarray(-32)).toBech32()
const uploadId='d6de704c-c489-42cb-bd5c-6509eb3d3a82'
const cid='bafy'+'a'.repeat(52)
const secret='test-only-pinata-JWT-'.repeat(4)
const body={uploadId,title:'Genesis artwork',description:'Artist-created',rightsAccepted:true}

function studioEnvironment(){
  const keys=['CREATOR_MEDIA_UPLOAD_ENABLED','PINATA_JWT','DATABASE_URL','ACCESS_JWT_SECRET']
  const saved=Object.fromEntries(keys.map(key=>[key,process.env[key]]))
  Object.assign(process.env,{
    CREATOR_MEDIA_UPLOAD_ENABLED:'1',PINATA_JWT:secret,
    DATABASE_URL:'postgres://never-connected-test-only',
    ACCESS_JWT_SECRET:'test-only-studio-session-key-long-enough',
  })
  return ()=>{
    for(const key of keys){
      if(saved[key]===undefined)delete process.env[key]
      else process.env[key]=saved[key]
    }
  }
}
function mediaDb({commitFails=false}={}){
  const row={
    id:uploadId,wallet,status:'pinned',
    sha256:'f'.repeat(64),mime:'image/png',
    uri:'ipfs://'+cid+'/recto.png',metadata_uri:null,metadata_sha256:null,
  }
  const calls=[]
  const dbTx=async fn=>fn({query:async(sql,params)=>{
    calls.push(sql)
    if(sql.startsWith('SELECT * FROM xartists_studio_media')){
      return {rows:[params[0]===uploadId&&params[1]===wallet?{...row}:null].filter(Boolean)}
    }
    if(sql.includes("SET status='metadata_pinning'")){
      if(row.status!=='pinned'||row.metadata_uri)return {rowCount:0}
      row.status='metadata_pinning'
      return {rowCount:1}
    }
    if(sql.includes('SET metadata_uri=')){
      if(commitFails)throw Error('database commit failed with sensitive DB details')
      if(row.status!=='metadata_pinning'||row.metadata_uri)return {rowCount:0}
      row.metadata_uri=params[1]
      row.metadata_sha256=params[2]
      row.status='pinned'
      return {rowCount:1}
    }
    if(sql.includes("SET status='pinned'")){
      if(row.status!=='metadata_pinning'||row.metadata_uri)return {rowCount:0}
      row.status='pinned'
      return {rowCount:1}
    }
    throw Error('Unexpected SQL operation')
  }})
  return {dbTx,row,calls}
}
async function withStudio(testBody){
  const restore=studioEnvironment()
  try{return await testBody()}finally{restore()}
}
test('confirmed metadata pin commits CID and deterministic fingerprint',async()=>withStudio(async()=>{
  const db=mediaDb()
  let posts=0
  const result=await pinStudioMetadata(wallet,body,async(_url,opts)=>{
    posts++
    assert.equal(opts.method,'POST')
    assert.equal(opts.headers.Authorization,'Bearer '+secret)
    const contents=JSON.parse(opts.body)
    assert.equal(contents.pinataContent.name,body.title)
    return {ok:true,json:async()=>({IpfsHash:cid})}
  },db.dbTx)
  assert.equal(posts,1)
  assert.equal(result.metadataUri,'ipfs://'+cid)
  assert.equal(db.row.status,'pinned')
  assert.equal(db.row.metadata_uri,'ipfs://'+cid)
  assert.match(db.row.metadata_sha256,/^[a-f0-9]{64}$/)
  const reused=await pinStudioMetadata(wallet,body,async()=>{throw Error('should not repin')},db.dbTx)
  assert.equal(reused.metadataUri,result.metadataUri)
}))
test('definitive Pinata rejection re-arms an idempotent retry',async()=>withStudio(async()=>{
  const db=mediaDb()
  await assert.rejects(pinStudioMetadata(wallet,body,async()=>({ok:false,status:403}),db.dbTx),
    e=>e.statusCode===502&&e.message==='pinata_metadata_failed')
  assert.equal(db.row.status,'pinned')
  const second=await pinStudioMetadata(wallet,body,async()=>({ok:true,json:async()=>({IpfsHash:cid})}),db.dbTx)
  assert.equal(second.metadataUri,'ipfs://'+cid)
}))
test('lost Pinata response holds the claim and blocks duplicate pin',async()=>withStudio(async()=>{
  const db=mediaDb()
  let posts=0
  await assert.rejects(pinStudioMetadata(wallet,body,async()=>{
    posts++;throw Error('network timeout with upstream status unknown')
  },db.dbTx),e=>e.statusCode===503&&e.message==='metadata_pin_result_unknown_reconcile')
  assert.equal(db.row.status,'metadata_pinning')
  await assert.rejects(pinStudioMetadata(wallet,body,async()=>{posts++;return {ok:true}},db.dbTx),
    /metadata_pinning_in_progress/)
  assert.equal(posts,1)
}))
test('bad 2xx Pinata receipt is unknown, never a reason to repeat public pin',async()=>withStudio(async()=>{
  const db=mediaDb()
  await assert.rejects(pinStudioMetadata(wallet,body,async()=>({ok:true,json:async()=>({IpfsHash:'bad'})}),db.dbTx),
    /metadata_pin_result_unknown_reconcile/)
  assert.equal(db.row.status,'metadata_pinning')
}))
test('database persistence error after a Pinata CID stays held for reconciliation',async()=>withStudio(async()=>{
  const db=mediaDb({commitFails:true})
  await assert.rejects(pinStudioMetadata(wallet,body,async()=>({ok:true,json:async()=>({IpfsHash:cid})}),db.dbTx),
    e=>e.statusCode===503&&e.message==='metadata_pin_result_unknown_reconcile'
      &&!e.message.includes('database'))
  assert.equal(db.row.status,'metadata_pinning')
  assert.equal(db.row.metadata_uri,null)
}))
