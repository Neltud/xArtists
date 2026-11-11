import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const source=readFileSync(new URL('../src/pages/VenuePage.tsx',import.meta.url),'utf8')
// Execute the actual page handler with wallet/provider dependencies replaced.
// This checks UI control flow, not chain settlement or React rendering.
const body=source.slice(source.indexOf('  const onPay = async () => {')+'  const onPay = async () => {'.length,source.indexOf('\n  return ('))
const handler=body.slice(0,body.lastIndexOf('\n  }'))
async function run({live=false,connected=false,canAttemptSign=false,reject=false,fallback=false}={}) {
  const owned=[],messages=[]
  let connects=0,sends=0
  const send=async()=>{sends++;if(reject)throw new Error('rejected');return {transactions:[{hash:'abc'}]}}
  const venue=fallback?{rentPay:send}:{rentPayLive:send,rentPayPaper:send}
  await new Function('live','connected','canAttemptSign','venue','selected','markWallOwned','push','requestOpenConnect',
    'return (async()=>{'+handler+'})()'
  )(live,connected,canAttemptSign,venue,{id:'wall-1',egld:0.05},(...v)=>owned.push(v),(...v)=>messages.push(v),()=>connects++)
  return {owned,messages,connects,sends}
}
test('paper reservation needs no wallet',async()=>{
  const r=await run()
  assert.equal(r.connects,0);assert.equal(r.sends,1)
  assert.equal(r.owned[0][1].mode,'paper')
})
test('live submission never creates a local paid wall',async()=>{
  const r=await run({live:true,connected:true,canAttemptSign:true})
  assert.equal(r.sends,1);assert.deepEqual(r.owned,[])
  assert.match(r.messages[0][0],/non confirmée/)
})
test('generic live send also grants no wall',async()=>{
  const r=await run({live:true,connected:true,canAttemptSign:true,fallback:true})
  assert.equal(r.sends,1);assert.deepEqual(r.owned,[])
})
test('disconnected and non-signing live sessions cannot submit',async()=>{
  const disconnected=await run({live:true})
  assert.equal(disconnected.connects,1);assert.equal(disconnected.sends,0)
  const expired=await run({live:true,connected:true})
  assert.equal(expired.sends,0);assert.deepEqual(expired.owned,[])
})
test('rejected live send never creates ownership',async()=>{
  const r=await run({live:true,connected:true,canAttemptSign:true,reject:true})
  assert.deepEqual(r.owned,[]);assert.equal(r.messages[0][1],'err')
})
