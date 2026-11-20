/** Opt-in disposable localhost PostgreSQL only; never Neon customer data. */
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createNeonAccountApi} from '../src/neonAccountApi.mjs'
import {neonAccountFixture,accountRequest} from './fixtures/neon-account-fixture.mjs'

const url=process.env.TEST_XA_ACCOUNT_DATABASE_URL||''
const permitted=(()=>{
  try{
    const u=new URL(url)
    return process.env.ALLOW_EPHEMERAL_XA_ACCOUNT_PG_TEST==='1'&&
      u.protocol==='postgres:'&&['127.0.0.1','localhost'].includes(u.hostname)&&
      u.pathname==='/xartists_account_probe'&&!u.search&&!u.hash
  }catch{return false}
})()

test('Neon HTTP adapter persists only verified accounts, isolates users and blocks disabled identities',{
  skip:!permitted&&'Requires opt-in disposable localhost xartists_account_probe',
},async()=>{
  const {default:pg}=await import('pg')
  const pool=new pg.Pool({connectionString:url,ssl:false,max:3})
  const f=neonAccountFixture()
  const app=createNeonAccountApi({...f,poolFactory:async()=>pool})
  const count=async()=>Number((await pool.query('SELECT count(*) FROM xa_user_accounts')).rows[0].count)
  try{
    await pool.query(await readFile(new URL('../migrations/20261109_xa_accounts_v1.sql',import.meta.url),'utf8'))
    const before=await count()
    const a=f.token('http-pg-fixture-a'),b=f.token('http-pg-fixture-b')
    assert.equal((await accountRequest(app,'/v1/account/me',{token:a})).status,404)
    assert.equal(await count(),before,'GET must never create a user')
    const sessions=await Promise.all(Array.from({length:5},()=>
      accountRequest(app,'/v1/account/session',{method:'POST',token:a})))
    const bodies=[]
    for(const response of sessions){
      assert.equal(response.status,200)
      bodies.push(await response.json())
    }
    const id=bodies[0].account.id
    assert.ok(bodies.every(x=>x.account.id===id))
    assert.equal(bodies.filter(x=>x.account.created).length,1,'advisory lock serializes creation')
    assert.equal(await count(),before+1)
    const me=await (await accountRequest(app,'/v1/account/me',{token:a})).json()
    assert.deepEqual(me.account,{id,type:'walletless',linkedWalletCount:0})
    for(const key of ['checkoutAuthorized','mintAuthorized','nftEntitlement'])assert.equal(me[key],false)
    assert.equal((await accountRequest(app,'/v1/account/me',{token:b})).status,404)
    const second=await accountRequest(app,'/v1/account/session',{method:'POST',token:b})
    assert.equal(second.status,200)
    assert.notEqual((await second.json()).account.id,id)
    assert.equal(await count(),before+2)
    assert.equal((await accountRequest(app,'/v1/account/me?user_id='+id,{token:b})).status,400)
    await pool.query('UPDATE xa_user_accounts SET disabled_at=now() WHERE id=$1',[id])
    assert.equal((await accountRequest(app,'/v1/account/session',{method:'POST',token:a})).status,403)
    assert.equal((await accountRequest(app,'/v1/account/me',{token:a})).status,404)
    assert.equal(await count(),before+2,'disabled identity must not be reassigned')
    const forbidden=await pool.query('SELECT (SELECT count(*) FROM xa_account_wallets) AS wallets, '+
      '(SELECT count(*) FROM xa_fiat_subscriptions) AS subscriptions')
    assert.deepEqual(forbidden.rows[0],{wallets:'0',subscriptions:'0'})
  }finally{await pool.end()}
})
