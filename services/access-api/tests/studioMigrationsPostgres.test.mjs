/** Real SQL proof in disposable localhost PG only; never accepts production DATABASE_URL. */
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {readFile} from 'node:fs/promises'
import {inspectStudioDatabase} from '../src/studioPreflight.mjs'

const raw=process.env.TEST_STUDIO_DATABASE_URL||''
const allowed=(()=>{try{const u=new URL(raw);return process.env.ALLOW_EPHEMERAL_STUDIO_PG_TEST==='1'
  &&u.protocol==='postgres:'&&['localhost','127.0.0.1'].includes(u.hostname)
  &&u.pathname==='/xartists_studio_probe'}catch{return false}})()

test('004+005 reject GLB, 006 admits bounded GLB and probes never change schema',{
  skip:!allowed&&'Only disposable localhost PostgreSQL fixture accepted',
},async()=>{
  const {default:pg}=await import('pg')
  const client=new pg.Client({connectionString:raw,ssl:false})
  await client.connect()
  const env={DATABASE_URL:raw,PGSSL:'0',STUDIO_GLB_UPLOAD_ENABLED:'1'}
  const probe=()=>inspectStudioDatabase({env})
  const migrate=async name=>client.query(await readFile(new URL('../migrations/'+name,import.meta.url),'utf8'))
  const insert=async(id,mime,bytes)=>client.query(
    "INSERT INTO public.xartists_studio_media(id,wallet,mime,bytes,status) VALUES($1,$2,$3,$4,'reserved')",
    [id,'erd1'+'a'.repeat(58),mime,bytes])
  try{
    assert.equal((await probe()).reason,'migration_004_missing')
    assert.equal((await client.query("SELECT to_regclass('public.xartists_studio_media') IS NULL AS missing")).rows[0].missing,true)
    await migrate('004_creator_media_pinata.sql')
    await migrate('005_creator_media_metadata_idempotency.sql')
    assert.equal((await probe()).reason,'migration_006_missing')
    assert.equal((await inspectStudioDatabase({env:{...env,STUDIO_GLB_UPLOAD_ENABLED:'0'}})).ready,true)
    await assert.rejects(insert('before','model/gltf-binary',1024),e=>e.code==='23514')
    await insert('existing','image/png',1024)
    await migrate('006_creator_media_glb.sql')
    await migrate('006_creator_media_glb.sql')
    assert.equal((await probe()).ready,true)
    assert.equal((await probe()).modelReady,true)
    await insert('glb','model/gltf-binary',33554432)
    await assert.rejects(insert('too-big','model/gltf-binary',33554433),e=>e.code==='23514')
    await assert.rejects(insert('bad-mime','text/html',1024),e=>e.code==='23514')
    await assert.rejects(insert('zero','image/png',0),e=>e.code==='23514')
    await client.query("UPDATE public.xartists_studio_media SET status='metadata_pinning' WHERE id='glb'")
    assert.equal((await client.query('SELECT count(*)::int AS n FROM public.xartists_studio_media')).rows[0].n,2)
    // A familiar index name is not evidence of the required quota lookup index.
    await client.query('DROP INDEX public.xartists_studio_media_wallet_created_idx')
    await client.query('CREATE INDEX xartists_studio_media_wallet_created_idx ON public.xartists_studio_media(id)')
    assert.equal((await probe()).ready,false)
  }finally{await client.end()}
})
