import test from 'node:test'
import assert from 'node:assert/strict'
import {generateKeyPairSync,randomBytes} from 'node:crypto'
import {Message,MessageComputer,UserSecretKey} from '@multiversx/sdk-core'
import {readFile} from 'node:fs/promises'
import pg from 'pg'
import {createAdminAuthChallengePgStore} from '../src/adminAuthChallengeStore.mjs'
import {createAdminProofRedemption} from '../src/adminAuthProofRedemption.mjs'

const conn=process.env.ADMIN_AUTH_TEST_DATABASE_URL
const NOW=1_700_000_000_000
function signer(){
  const {privateKey}=generateKeyPairSync('ed25519')
  const sk=new UserSecretKey(Buffer.from(privateKey.export({format:'jwk'}).d,'base64url'))
  const address=sk.generatePublicKey().toAddress()
  return {sk,address,bech32:address.toBech32()}
}
async function sign(s,message){
  const computer=new MessageComputer()
  const msg=new Message({address:s.address,data:new TextEncoder().encode(message)})
  return Buffer.from(await s.sk.sign(computer.computeBytesForSigning(msg))).toString('hex')
}

test('live ephemeral PostgreSQL: SDK signature + concurrent FOR UPDATE single-use proof', {
  skip:!conn
},async t=>{
  const schema='admin_redeem_test_'+randomBytes(6).toString('hex')
  const adminPool=new pg.Pool({connectionString:conn,ssl:false})
  await adminPool.query('CREATE SCHEMA '+schema)
  const pool=new pg.Pool({connectionString:conn,ssl:false,max:16,
    options:'-c search_path='+schema})
  let now=NOW
  try{
    const sql=await readFile(new URL('../migrations/006_admin_auth_challenges_v1.sql',import.meta.url),'utf8')
    await pool.query(sql)
    const owner=signer(),attacker=signer()
    let serial=0
    const issue=createAdminAuthChallengePgStore(pool,{
      nowMs:()=>now,randomNonce:()=> 'proofpgtx'+String(++serial).padStart(12,'0')
    })
    const proof=createAdminProofRedemption(pool,{
      nowMs:()=>now+100,allowlistedAdmins:[owner.bech32]
    })
    const create=async()=>{
      const row=await issue.issue({adminBech32:owner.bech32,action:'setPaused',ttlMs:120_000})
      assert.equal(row.ok,true)
      return row
    }
    const req=(row,signatureHex)=>({
      nonce:row.nonce,adminBech32:owner.bech32,action:'setPaused',signatureHex
    })

    await t.test('12 race contenders: one signed nonce can be consumed only once',async()=>{
      const issued=await create()
      const signatureHex=await sign(owner,issued.message)
      const result=await Promise.all(
        Array.from({length:12},()=>proof.redeem(req(issued,signatureHex)))
      )
      assert.equal(result.filter(x=>x.ok).length,1)
      assert.equal(result.filter(x=>!x.ok).length,11)
      assert.equal(result.find(x=>x.ok).authorizesActions,false)
      const row=await pool.query('SELECT consumed_at_ms FROM admin_auth_challenges_v1 WHERE nonce=$1',[issued.nonce])
      assert.equal(Number(row.rows[0].consumed_at_ms),now+100)
    })

    await t.test('failed signature does not consume; valid signature works afterward',async()=>{
      const issued=await create()
      const wrong=await sign(attacker,issued.message)
      const denied=await proof.redeem(req(issued,wrong))
      assert.equal(denied.ok,false)
      const db=await pool.query('SELECT consumed_at_ms FROM admin_auth_challenges_v1 WHERE nonce=$1',[issued.nonce])
      assert.equal(db.rows[0].consumed_at_ms,null)
      assert.equal((await proof.redeem(req(issued,await sign(owner,issued.message)))).ok,true)
    })

    await t.test('time expiry preserves unconsumed row and produces no success receipt',async()=>{
      const issued=await create()
      const signed=await sign(owner,issued.message)
      now=NOW+120_000
      const denied=await proof.redeem(req(issued,signed))
      assert.equal(denied.ok,false)
      const db=await pool.query('SELECT consumed_at_ms FROM admin_auth_challenges_v1 WHERE nonce=$1',[issued.nonce])
      assert.equal(db.rows[0].consumed_at_ms,null)
    })
  }finally{
    await pool.end()
    await adminPool.query('DROP SCHEMA '+schema+' CASCADE')
    await adminPool.end()
  }
})
