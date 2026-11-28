import pg from 'pg'
import {readFileSync} from 'node:fs'
import {createStudioHandler,targetReady} from './handler.mjs'
import {createChallengeStore} from './store.mjs'
let store=null
if(targetReady(process.env)&&process.env.DATABASE_URL){
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:true},max:2,connectionTimeoutMillis:4000,idleTimeoutMillis:1000,statement_timeout:5000})
 pool.on('error',()=>{})
 store=createChallengeStore(pool)
}
let sourceSha=null
try {
 const meta=JSON.parse(readFileSync(new URL('../../../build-meta.json',import.meta.url),'utf8'))
 if(typeof meta.source_sha==='string'&&/^[a-f0-9]{40}$/.test(meta.source_sha))sourceSha=meta.source_sha
}catch{}
export default createStudioHandler({store,sourceSha})
