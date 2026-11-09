import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {egldTextToWei} from '../src/lib/egldExactAmount.mjs'
import {
  getFreshPackPriceAtomic,requireExactPackQuoteAgreement,
} from '../src/lib/agentPackVmQuote.mjs'

const sc='erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg'
const b64=atomic=>{
  let hex=BigInt(atomic).toString(16)
  if(hex.length%2)hex='0'+hex
  return Buffer.from(hex,'hex').toString('base64')
}
const vmOk=(atomic,caseStyle='upper')=>new Response(JSON.stringify({
  code:'successful',data:{data:caseStyle==='upper'
    ? {ReturnCode:0,ReturnMessage:'',ReturnData:[b64(atomic)]}
    : {returnCode:'ok',returnMessage:'',returnData:[b64(atomic)]}},
}),{status:200,headers:{'content-type':'application/json'}})

test('all pack VM price lookups use contract, correct u8 and exact 18-decimal atomic values',async()=>{
  const cases=[['pulse',1,'1'],['yield',2,'5'],['sentinel',3,'2.5']]
  for(const [pack,enumId,egld] of cases){
    let requests=0
    const expected=egldTextToWei(egld)
    const observed=await getFreshPackPriceAtomic(sc,enumId,async(url,opts)=>{
      requests++
      assert.equal(url,'https://gateway.multiversx.com/vm-values/query')
      assert.equal(opts.method,'POST')
      assert.equal(opts.redirect,'error')
      assert.equal(opts.cache,'no-store')
      assert.equal(opts.headers['Content-Type'],'application/json')
      assert.ok(opts.signal)
      const body=JSON.parse(opts.body)
      assert.deepEqual(body,{scAddress:sc,funcName:'getPackPrice',
        args:[enumId.toString(16).padStart(2,'0')]})
      return vmOk(expected)
    })
    assert.equal(observed,expected,pack)
    assert.equal(requests,1)
  }
})

test('correctly handles lowercase successful VM response from proxy variants',async()=>{
  const value=egldTextToWei('0.000000000000000001')
  const got=await getFreshPackPriceAtomic(sc,1,async()=>vmOk(value,'lower'))
  assert.equal(got,value)
})

test('stale catalogue must NEVER be used to sign 33/22.5/15 EGLD for 1/5/2.5 EGLD quotes',()=>{
  for(const [actual,marketing] of [['1','33'],['5','22.5'],['2.5','15']]){
    const quote=egldTextToWei(actual)
    assert.throws(()=>requireExactPackQuoteAgreement(quote,marketing),
      /pack_onchain_price_disagrees_with_catalog/)
    assert.equal(requireExactPackQuoteAgreement(quote,actual),quote)
  }
})

test('rejects malformed VM result codes, missing data, zero or oversized amounts',async()=>{
  for(const response of [
    new Response('down',{status:503}),
    new Response(JSON.stringify({code:'successful',data:{data:{ReturnCode:4,ReturnData:[b64(100n)]}}})),
    new Response(JSON.stringify({code:'failed',data:{data:{ReturnCode:0,ReturnData:[b64(100n)]}}})),
    new Response(JSON.stringify({code:'successful',data:{data:{ReturnCode:0,ReturnMessage:'bad',ReturnData:[b64(100n)]}}})),
    new Response(JSON.stringify({code:'successful',data:{data:{ReturnCode:0,ReturnData:[]}}})),
    new Response(JSON.stringify({code:'successful',data:{data:{ReturnCode:0,ReturnData:['!notbase64!']}}})),
    vmOk(0n),
    vmOk(1001n*10n**18n),
  ])await assert.rejects(getFreshPackPriceAtomic(sc,1,async()=>response),
    /pack_onchain_quote_unavailable/)
})

test('malformed contract or enum cannot open a network request',async()=>{
  let calls=0
  for(const [address,enumId] of [
    ['erd1wrong',1],[sc,0],[sc,4],[sc,1.5],[sc,NaN],
  ])await assert.rejects(getFreshPackPriceAtomic(address,enumId,async()=>{calls++;return vmOk(100n)}),
    /pack_quote_invalid_request/)
  assert.equal(calls,0)
})

test('unreachable gateway never leaks upstream stack or credentials',async()=>{
  const value=await getFreshPackPriceAtomic(sc,2,async()=>{throw Error('upstream JWT and private hostname')})
    .catch(e=>e.message)
  assert.equal(value,'pack_onchain_quote_unavailable')
  assert.ok(!value.includes('JWT'))
})

test('precise decimal strings never route through unsafe floating point',()=>{
  assert.equal(egldTextToWei('22.5'),'22500000000000000000')
  assert.equal(egldTextToWei('0.000000000000000001'),'1')
  assert.throws(()=>egldTextToWei('1e-18'))
  assert.throws(()=>egldTextToWei('22.5000000000000000001'))
  assert.throws(()=>requireExactPackQuoteAgreement('2.5','2.5'))
  assert.throws(()=>requireExactPackQuoteAgreement('01', '0.000000000000000001'))
})

test('pack wallet hook has fresh VM pre-signature predicate and no unsafe fallback',()=>{
  const hook=readFileSync(new URL('../src/hooks/useAgentPackTx.ts',import.meta.url),'utf8')
  const gates=readFileSync(new URL('../src/config/scStatus.ts',import.meta.url),'utf8')
  assert.match(hook,/getFreshPackPriceAtomic\(receiver, PACK_ENUM\[id\]\)/)
  assert.match(hook,/requireExactPackQuoteAgreement/)
  assert.match(hook,/value: priceAtomic/)
  assert.match(hook,/buyAgentAction ne livre pas de NFT pack/)
  assert.doesNotMatch(hook,/BigInt\(Math\.round\(egld \* 1e18\)\)/)
  assert.doesNotMatch(hook,/const sid = await buyAgentListing\(listingId/)
  assert.match(gates,/AGENT_PACK_PUBLIC_MINT_RELEASED = false/)
  assert.match(gates,/AGENT_PACK_PUBLIC_COMMERCE_RELEASED = false/)
  const quoteAt=hook.indexOf('getFreshPackPriceAtomic(receiver, PACK_ENUM[id])')
  const sendAt=hook.indexOf('const res = await send(',quoteAt)
  assert.ok(quoteAt>0 && sendAt>quoteAt,'quote before wallet signing prompt')
})
