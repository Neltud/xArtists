import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {createHash} from 'node:crypto'
import {buildSync} from 'esbuild'
const require=createRequire(import.meta.url)
const {PublicKey}=require('@solana/web3.js')
const code=buildSync({entryPoints:[new URL('../src/lib/solanaInstructions.ts',import.meta.url).pathname],bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent',external:['@solana/web3.js']}).outputFiles[0].text
const module={exports:{}};new Function('require','module','exports',code)(require,module,module.exports)
const {buildMarketplaceInstruction:market,buildGovernanceInstruction:dao}=module.exports
const fixture={cluster:'localnet',authority:'11111111111111111111111111111111',seller:'11111111111111111111111111111111',owner:'11111111111111111111111111111111',mint:'3chFT3jsz3jhPXujW8MNjXPB8UUdHY6pSBkB3A37kLJd',id:0n}
const discriminator=name=>createHash('sha256').update('global:'+name).digest().subarray(0,8)
test('no environment, caller-supplied price or local program id enables public network instructions',async()=>{
 for(const cluster of ['mainnet','devnet','unknown']){
  await assert.rejects(market({...fixture,cluster,action:'list_nft',price:1n,expiresAt:2000000000n}),/program_not_deployed/)
  await assert.rejects(dao({...fixture,cluster,action:'vote',support:true}),/program_not_deployed/)
 }
})
test('local NFT listing encodes Anchor instruction and exact u64 price without a signer or sender',async()=>{
 const price=9007199254740993n
 const result=await market({...fixture,action:'list_nft',price,expiresAt:2000000000n})
 assert.deepEqual(result.data.slice(0,8),new Uint8Array(discriminator('list_nft')))
 assert.equal(new DataView(result.data.buffer).getBigUint64(16,true),price)
 assert.equal(result.accounts.length,8)
 assert.deepEqual(result.accounts.filter(x=>x.isSigner).map(x=>x.pubkey),[fixture.seller])
 assert.equal(new PublicKey(result.accounts[4].pubkey).equals(new PublicKey(result.accounts[5].pubkey)),false)
 assert.equal('send' in result,false);assert.equal('sign' in result,false)
 await assert.rejects(market({...fixture,action:'list_nft',price:1n<<64n,expiresAt:1n}),/invalid_u64/)
 await assert.rejects(market({...fixture,action:'list_nft',price:0n,expiresAt:1n}),/invalid_listing/)
})
test('local governance derives a unique vote receipt per proposal and validates source text',async()=>{
 const a=await dao({...fixture,action:'vote',support:true}),b=await dao({...fixture,id:1n,action:'vote',support:true})
 assert.equal(a.accounts.length,6);assert.notEqual(a.accounts[4].pubkey,b.accounts[4].pubkey)
 assert.deepEqual(a.data.slice(0,8),new Uint8Array(discriminator('vote')));assert.equal(a.data[8],1)
 const unstake=await dao({...fixture,action:'unstake',amount:100n})
 assert.equal(unstake.accounts[0].isSigner,true)
 for(const values of [{title:'',uri:'https://example.org',duration:3600n},{title:'Art',uri:'javascript:alert(1)',duration:3600n},{title:'Art',uri:'ipfs://proof',duration:0n}]){
  await assert.rejects(dao({...fixture,action:'create_proposal',...values}),/invalid_proposal/)
 }
})
