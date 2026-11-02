import assert from 'node:assert/strict'
import {test} from 'node:test'
import {troBridgeStatus,TRO_ORIGIN_ID} from '../src/troBridgeStatus.mjs'
import {startServer} from './server-fixture.mjs'

test('TRO bridge status cannot be enabled by unsafe environment flags',()=>{
  const old={...process.env}
  try{
    Object.assign(process.env,{TRO_BRIDGE_LIVE:'1',TRO_SOLANA_MINT:'FakeMint12345678912345678912345678912',
      TRO_DIRECT_SALE:'1'})
    const s=troBridgeStatus()
    assert.equal(s.source.tokenIdentifier,TRO_ORIGIN_ID)
    assert.equal(s.destination.mintAddress,null)
    assert.equal(s.bridge.transferAvailable,false)
    assert.equal(s.sale.directSaleLive,false)
    assert.equal(s.sale.paymentAddress,null)
    assert.equal(s.noTransferInstructions,true)
  }finally{
    for(const k of ['TRO_BRIDGE_LIVE','TRO_SOLANA_MINT','TRO_DIRECT_SALE']){
      if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k]
    }
  }
})
test('public bridge status has no fake quotes, balances or checkout addresses',async()=>{
  const app=await startServer({TRO_BRIDGE_LIVE:'1',TRO_SOLANA_MINT:'abc',
    TRO_DIRECT_SALE:'1'})
  try{
    const res=await fetch(app.base+'/v1/tro/bridge/status')
    assert.equal(res.status,200)
    const j=await res.json()
    assert.equal(j.bridge.status,'disabled')
    assert.equal(j.bridge.quoteAvailable,false)
    assert.equal(j.destination.mintAddress,null)
    assert.equal(j.sale.price,null)
    assert.equal(j.sale.paymentAddress,null)
    const attempt=await fetch(app.base+'/v1/tro/bridge/transfer',{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:'1'})})
    assert.equal(attempt.status,404)
  }finally{await app.close()}
})
