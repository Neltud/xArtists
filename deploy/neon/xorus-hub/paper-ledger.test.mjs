import test from 'node:test'
import assert from 'node:assert/strict'
import { createPaperState, applyPaperCommand, paperLedgerView } from './shared/paper-ledger.mjs'
import { createPaperStore } from './paper-store.mjs'
import { createHub } from './hub.mjs'

const NOW = Date.parse('2026-11-22T15:00:00Z'), DAY = 86400000
const key = n => '00000000-0000-4000-8000-' + n.toString(16).padStart(12, '0')
const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const propose = (n, patch = {}) => ({type:'propose',idempotency_key:key(n),network:'solana',token_in:'native',token_out:USDC,
  notional_cents:500,fee_cents:1,slippage_bps:50,reference_at_ms:NOW,...patch})
const close = (n, id, value, patch = {}) => ({type:'close',idempotency_key:key(n),proposal_id:key(id),value_cents:value,fee_cents:1,reference_at_ms:NOW,...patch})
const initial = () => createPaperState({now:NOW})
function apply(state, command, now=NOW) {
  const result=applyPaperCommand(state,command,now)
  assert.equal(result.ok,true,JSON.stringify(result))
  return result
}

test('paper lifecycle accounts for entry/exit fees and price losses without inventing execution or quotes',()=>{
  const entry=apply(initial(),propose(1))
  assert.equal(entry.view.risk.global.loss_24h_cents,1)
  assert.equal(entry.view.risk.global.open_notional_cents,500)
  const ended=apply(entry.state,close(2,1,470))
  assert.equal(ended.view.risk.global.open_positions,0)
  assert.equal(ended.view.risk.global.loss_24h_cents,32)
  assert.equal(ended.view.risk.paper_net_pnl_cents,-32)
  assert.equal(ended.state.execution_authorized,false)
  assert.equal(ended.state.live_budget_cents,0)
  assert.equal(ended.view.provider_quote_verified,false)
  assert.equal(ended.view.transaction_payload,null)
  assert.equal(applyPaperCommand(entry.state,close(3,1,500,{fee_cents:50000}),NOW).error,'insufficient_virtual_cash_for_fees')
})

test('same idempotency key replays after expiry without mutation; changed payload conflicts',()=>{
  const cmd=propose(1), entry=apply(initial(),cmd)
  const replay=apply(entry.state,cmd,NOW+DAY)
  assert.equal(replay.replayed,true)
  assert.equal(replay.state.revision,1)
  assert.deepEqual(replay.state,entry.state)
  assert.equal(applyPaperCommand(entry.state,{...cmd,notional_cents:499},NOW).error,'idempotency_conflict')
})

test('parallel-network caps, one position per network, exact identities, amounts, fees and slippage fail closed',()=>{
  const state=apply(initial(),propose(1)).state
  assert.equal(applyPaperCommand(state,propose(2),NOW).error,'position_limit')
  const other=apply(state,propose(2,{network:'multiversx',token_in:'EGLD',token_out:'TEST-abcdef'}))
  assert.equal(other.view.risk.global.open_notional_cents,1000)
  for (const patch of [{network:'ethereum'}, {notional_cents:501}, {notional_cents:NaN}, {notional_cents:true},
    {fee_cents:null}, {fee_cents:100}, {slippage_bps:51}, {token_out:'USDC'}, {token_out:'1'.repeat(44)},
    {private_key:'SECRET'}, {wallet:'SECRET'}, {value_cents:3}, {reference_at_ms:NOW-30001}, {reference_at_ms:NOW+5001}]) {
    const result=applyPaperCommand(initial(),propose(1,patch),NOW)
    assert.equal(result.ok,false,JSON.stringify(patch))
    assert.equal(JSON.stringify(result).includes('SECRET'),false)
  }
})

test('unrealized loss halts new entries, recovery cannot undo the latch, and closing remains possible',()=>{
  let state=apply(initial(),propose(1)).state
  state=apply(state,{type:'mark',idempotency_key:key(2),proposal_id:key(1),value_cents:390,reference_at_ms:NOW}).state
  assert.equal(state.halts.networks.solana.daily_until_ms,NOW+DAY)
  state=apply(state,{type:'mark',idempotency_key:key(3),proposal_id:key(1),value_cents:600,reference_at_ms:NOW}).state
  state=apply(state,close(4,1,600)).state
  assert.equal(applyPaperCommand(state,propose(5),NOW).error,'daily_loss_stop')
  const next=NOW+DAY+1
  assert.equal(applyPaperCommand(state,propose(5,{reference_at_ms:next}),next).ok,true)
})

test('gross losses and fees are not offset by profitable simulated trades',()=>{
  let state=apply(initial(),propose(1)).state
  state=apply(state,close(2,1,470)).state
  state=apply(state,propose(3)).state
  state=apply(state,close(4,3,900)).state
  assert.equal(paperLedgerView(state,NOW).risk.global.loss_pilot_cents,34)
  assert.equal(paperLedgerView(state,NOW).risk.paper_net_pnl_cents,366)
})

test('pilot stop is sticky beyond daily rollover and never silently restarts',()=>{
  let state=apply(initial(),propose(1)).state
  state=apply(state,close(2,1,0)).state
  assert.equal(state.halts.pilot,true)
  const future=NOW+2*DAY
  const mvx=propose(3,{network:'multiversx',token_in:'EGLD',token_out:'TEST-abcdef',reference_at_ms:future})
  assert.equal(applyPaperCommand(state,mvx,future).error,'pilot_loss_stop')
})

test('zero virtual capital, invalid stored limits and reversed clocks never admit a position',()=>{
  assert.equal(applyPaperCommand(createPaperState({capitalCents:0,now:NOW}),propose(1),NOW).ok,false)
  const bad=initial();bad.limits.networks.solana.max_order_cents=99999
  assert.equal(applyPaperCommand(bad,propose(1),NOW).error,'invalid_paper_limits')
  const state=apply(initial(),propose(1)).state
  assert.equal(applyPaperCommand(state,close(2,1,500,{reference_at_ms:NOW-1}),NOW-1).error,'invalid_or_reversed_clock')
})

function transactionalPool() {
  let stored=null, queue=Promise.resolve(), commits=0, releases=0
  const pool={async query(){return{rows:stored?[structuredClone(stored)]:[]}},async connect(){
    let local,unlock
    return {async query(sql,values){
      if(sql==='BEGIN') {const before=queue;queue=new Promise(resolve=>unlock=resolve);await before;local=structuredClone(stored);return{}}
      if(sql.startsWith('INSERT')) {local??={revision:0,state:JSON.parse(values[1])};return{rowCount:1}}
      if(sql.startsWith('SELECT')) {assert.match(sql,/FOR UPDATE/);return{rows:[structuredClone(local)]}}
      if(sql.startsWith('UPDATE')) {assert.match(sql,/revision = \$4/);if(local.revision!==values[3])return{rowCount:0};local={revision:values[1],state:JSON.parse(values[2])};return{rowCount:1}}
      if(sql==='COMMIT'){stored=structuredClone(local);commits++;unlock();return{}}
      if(sql==='ROLLBACK'){unlock?.();return{}}
      throw new Error('unexpected_sql')
    },release(){releases++}}
  },info:()=>({stored,commits,releases})}
  return pool
}

test('transactional store serializes racing entries and duplicate retries across separate requests',async()=>{
  const pool=transactionalPool(),store=createPaperStore(pool,{clock:()=>NOW})
  const results=await Promise.all([store.command(propose(1)),store.command(propose(2))])
  assert.equal(results.filter(r=>r.ok).length,1)
  assert.equal(results.find(r=>!r.ok).error,'position_limit')
  assert.equal(pool.info().stored.revision,1)
  const replay=await store.command(propose(1))
  assert.equal(replay.replayed,true)
  assert.equal(pool.info().stored.revision,1)
  assert.equal(pool.info().releases,3)
  assert.equal((await store.read()).view.risk.global.open_notional_cents,500)
})

test('failed commits roll back and release the connection, never returning a success',async()=>{
  const calls=[]
  const pool={async connect(){return{async query(sql){calls.push(sql);if(sql==='BEGIN')return{};throw new Error('SECRET')},release(){calls.push('release')}}}}
  await assert.rejects(()=>createPaperStore(pool).command(propose(1)),/SECRET/)
  assert.equal(calls.at(-2),'ROLLBACK')
  assert.equal(calls.at(-1),'release')
})

test('HTTP paper routes authenticate before SQL, bound input and refuse wrong database targets',async()=>{
  const token='t'.repeat(48),auth={authorization:'Bearer '+token,'content-type':'application/json'}
  const env={NEON_BRANCH_ID:'br-steep-sun-bab7l93p',XORUS_HUB_TARGET_CONFIRMED:'orange-dust-23862418',XORUS_HUB_OPERATOR_TOKEN:token,XORUS_LIVE_TRADING:'1'}
  const fail=()=>assert.fail('unexpected external work')
  const hub=createHub({env,paperStore:createPaperStore(transactionalPool(),{clock:()=>NOW}),fetchImpl:fail,clock:()=>NOW})
  const call=(path,options)=>hub.fetch(new Request('https://hub.invalid/v1/xorus/'+path,options))
  assert.equal((await call('paper')).status,200)
  assert.equal((await call('paper/account')).status,401)
  assert.equal((await call('paper/commands',{method:'POST',body:'SECRET'})).status,401)
  assert.equal((await call('paper/commands',{method:'POST',headers:auth,body:'x'.repeat(4097)})).status,400)
  const entry=await call('paper/commands',{method:'POST',headers:auth,body:JSON.stringify(propose(1))})
  assert.equal(entry.status,200)
  const payload=await entry.json()
  assert.equal(payload.view.revision,1)
  assert.equal(payload.execution_authorized,false)
  assert.equal(payload.view.virtual_capital,true)
  const wrong=createHub({env:{...env,NEON_BRANCH_ID:'br-other'},paperStore:{command:fail}})
  assert.equal((await wrong.fetch(new Request('https://hub.invalid/v1/xorus/paper/commands',{method:'POST',headers:auth,body:'{}'}))).status,503)
})
