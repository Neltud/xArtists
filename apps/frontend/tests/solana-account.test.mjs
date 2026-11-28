import test from 'node:test'
import assert from 'node:assert/strict'
import {decodePublicKey,normalizeSolanaAccount,readSolanaPortfolio,formatSolanaUnits,SPL_TOKEN_PROGRAM} from '../src/lib/solanaAccount.mjs'
const owner='11111111111111111111111111111111'
const mint='2xqre66jAqcSZFh1seMkgvQNVgG6uL1gwBtKVWuwePYC'
const account={address:owner,publicKey:new Uint8Array(32),chains:['solana:mainnet']}
test('Solana accounts need matching 32-byte public keys and a mainnet namespace',()=>{
 assert.equal(normalizeSolanaAccount(account),account)
 for(const row of [{...account,publicKey:new Uint8Array(32).fill(1)},{...account,address:'erd1'+'a'.repeat(58)},{...account,chains:['solana:devnet']},{...account,address:'0'.repeat(44)},{...account,publicKey:[]}])assert.equal(normalizeSolanaAccount(row),null)
 assert.equal(decodePublicKey(owner).length,32)
 assert.equal(decodePublicKey('1'.repeat(33)),null)
})
function reader({supply='1',decimals=0,foreignOwner=false,fail=false,unsafeBalance=false}={}){
 const calls=[]
 return {calls,fetchImpl:async(url,options)=>{
  const request=JSON.parse(options.body);calls.push(request)
  assert.equal(url,'https://api.mainnet-beta.solana.com')
  assert.equal(options.method,'POST')
  if(fail)return {ok:false,status:503}
  const result=request.method==='getBalance'?{value:unsafeBalance?Number.MAX_SAFE_INTEGER+1:1234567890}
   :request.method==='getTokenAccountsByOwner'?{value:[{pubkey:mint,account:{owner:SPL_TOKEN_PROGRAM,data:{parsed:{info:{owner:foreignOwner?mint:owner,mint,tokenAmount:{amount:'1',decimals}}}}}}]}
   :{value:[{owner:SPL_TOKEN_PROGRAM,data:{parsed:{type:'mint',info:{isInitialized:true,decimals,supply}}}}]}
  return {ok:true,json:async()=>({jsonrpc:'2.0',id:request.id,result})}
 }}
}
test('NFTs require account ownership and a separately verified 1/1 zero-decimal mint',async()=>{
 const r=reader();const result=await readSolanaPortfolio(owner,{fetchImpl:r.fetchImpl})
 assert.equal(result.owner,owner);assert.equal(result.lamports,'1234567890');assert.equal(result.nfts.length,1)
 assert.deepEqual(r.calls.map(x=>x.method).sort(),['getBalance','getMultipleAccounts','getTokenAccountsByOwner'].sort())
 for(const options of [{supply:'2'},{decimals:6},{foreignOwner:true}]){
  const r=reader(options);const result=await readSolanaPortfolio(owner,{fetchImpl:r.fetchImpl});assert.equal(result.nfts.length,0)
 }
})
test('network errors and unsafe numeric balances never become a zero account',async()=>{
 for(const options of [{fail:true},{unsafeBalance:true}]){
  const r=reader(options);await assert.rejects(readSolanaPortfolio(owner,{fetchImpl:r.fetchImpl}))
 }
 let calls=0
 await assert.rejects(readSolanaPortfolio('erd1'+'a'.repeat(58),{fetchImpl:async()=>{calls++;throw Error()}}));assert.equal(calls,0)
})
test('SPL and SOL amounts preserve atomic precision beyond safe floating point',()=>{
 assert.equal(formatSolanaUnits('9007199254740993',6),'9007199254.740993')
 assert.equal(formatSolanaUnits('1234567890',9),'1.23456789')
 assert.equal(formatSolanaUnits('0',9),'0')
 assert.equal(formatSolanaUnits('1',0),'1')
 assert.equal(formatSolanaUnits('-1',9),'—')
})

test('multiple classic SPL token accounts aggregate by mint without losing atomic precision',async()=>{
 const rows=[
  {pubkey:owner,account:{owner:SPL_TOKEN_PROGRAM,data:{parsed:{info:{owner,mint,tokenAmount:{amount:'9007199254740993',decimals:6}}}}}},
  {pubkey:mint,account:{owner:SPL_TOKEN_PROGRAM,data:{parsed:{info:{owner,mint,tokenAmount:{amount:'7',decimals:6}}}}}},
 ]
 const fetchImpl=async(url,o)=>{const q=JSON.parse(o.body);assert.equal(o.redirect,'error');const result=q.method==='getBalance'?{value:0}:{value:[...rows,rows[0]]};return {ok:true,json:async()=>({id:q.id,result})}}
 const data=await readSolanaPortfolio(owner,{fetchImpl})
 assert.deepEqual(data.tokens,[{mint,amount:'9007199254741000',decimals:6,nft:false}])
 assert.equal(data.nfts.length,0)
 rows[1].account.data.parsed.info.tokenAmount.decimals=7
 await assert.rejects(readSolanaPortfolio(owner,{fetchImpl}),/conflicting_mint_decimals/)
})
test('duplicate token account with contradictory content is rejected; malformed rows flag incomplete inventory',async()=>{
 const row={pubkey:mint,account:{owner:SPL_TOKEN_PROGRAM,data:{parsed:{info:{owner,mint,tokenAmount:{amount:'2',decimals:0}}}}}}
 let rows=[row,{...row,account:{...row.account,data:{parsed:{info:{...row.account.data.parsed.info,tokenAmount:{amount:'3',decimals:0}}}}}}]
 const fetchImpl=async(url,o)=>{const q=JSON.parse(o.body);return {ok:true,json:async()=>({id:q.id,result:q.method==='getBalance'?{value:0}:{value:rows}})}}
 await assert.rejects(readSolanaPortfolio(owner,{fetchImpl}),/conflicting_token_account/)
 rows=[row,{...row,pubkey:'invalid'}]
 const data=await readSolanaPortfolio(owner,{fetchImpl})
 assert.equal(data.limited,true)
 assert.equal(data.tokens.length,1)
})
