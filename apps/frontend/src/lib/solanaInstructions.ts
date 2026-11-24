/** Unsigned local-development descriptors, never a signer or sender.
 * Mainnet/devnet builders fail closed until their deployment registry is reviewed.
 * Account order follows the Anchor programs in contracts/solana.
 */
import {PublicKey,SystemProgram} from '@solana/web3.js'
import {getSolanaProgram,type SolanaCluster} from '../config/solanaPrograms'
const TOKEN=new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
const ATA=new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
const utf8=(s:string)=>new TextEncoder().encode(s)
const pub=(s:string)=>new PublicKey(s)
function u64(value:bigint){if(typeof value!=='bigint'||value<0n||value>0xffffffffffffffffn)throw new Error('invalid_u64');const b=new Uint8Array(8);new DataView(b.buffer).setBigUint64(0,value,true);return b}
function i64(value:bigint){if(typeof value!=='bigint'||value<0n||value>0x7fffffffffffffffn)throw new Error('invalid_timestamp');const b=new Uint8Array(8);new DataView(b.buffer).setBigInt64(0,value,true);return b}
function text(value:string,max:number){const b=utf8(value);if(!b.length||b.length>max)throw new Error('invalid_text');const out=new Uint8Array(4+b.length);new DataView(out.buffer).setUint32(0,b.length,true);out.set(b,4);return out}
function concat(...parts:Uint8Array[]){const b=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let i=0;for(const p of parts){b.set(p,i);i+=p.length}return b}
const pda=(program:PublicKey,...seeds:Uint8Array[])=>PublicKey.findProgramAddressSync(seeds,program)[0]
const ata=(owner:PublicKey,mint:PublicKey)=>pda(ATA,owner.toBytes(),TOKEN.toBytes(),mint.toBytes())
const meta=(key:PublicKey,isSigner=false,isWritable=false)=>({pubkey:key.toBase58(),isSigner,isWritable})
async function data(name:string,...args:Uint8Array[]){const hash=await crypto.subtle.digest('SHA-256',utf8('global:'+name));return concat(new Uint8Array(hash).slice(0,8),...args)}
function program(cluster:SolanaCluster,kind:'marketplace'|'governance'){const id=getSolanaProgram(cluster,kind);if(!id)throw new Error('program_not_deployed');return pub(id)}
export async function buildMarketplaceInstruction(input:{
 cluster:SolanaCluster;action:'list_nft'|'buy'|'cancel';authority:string;seller:string;mint:string;
 id:bigint;price?:bigint;expiresAt?:bigint;buyer?:string;treasury?:string;
}){
 if(!['list_nft','buy','cancel'].includes(input.action))throw new Error('invalid_action')
 const id=program(input.cluster,'marketplace'),seller=pub(input.seller),mint=pub(input.mint),market=pda(id,utf8('market'),pub(input.authority).toBytes())
 const listing=pda(id,utf8('listing'),market.toBytes(),u64(input.id)),vault=pda(id,utf8('vault'),listing.toBytes())
 if(input.action==='list_nft'){
  if(input.price===undefined||input.price<=0n||input.expiresAt===undefined)throw new Error('invalid_listing')
  return {programId:id.toBase58(),accounts:[meta(seller,true,true),meta(market,false,true),meta(mint),meta(ata(seller,mint),false,true),meta(listing,false,true),meta(vault,false,true),meta(TOKEN),meta(SystemProgram.programId)],data:await data('list_nft',u64(input.id),u64(input.price),i64(input.expiresAt))}
 }
 if(input.action==='buy'){
  if(!input.buyer||!input.treasury||input.price===undefined||input.price<=0n)throw new Error('invalid_purchase')
  const buyer=pub(input.buyer)
  return {programId:id.toBase58(),accounts:[meta(buyer,true,true),meta(market),meta(seller,false,true),meta(pub(input.treasury),false,true),meta(mint),meta(listing,false,true),meta(vault,false,true),meta(ata(buyer,mint),false,true),meta(TOKEN),meta(ATA),meta(SystemProgram.programId)],data:await data('buy',u64(input.price))}
 }
 return {programId:id.toBase58(),accounts:[meta(seller,true,true),meta(market),meta(mint),meta(listing,false,true),meta(vault,false,true),meta(ata(seller,mint),false,true),meta(TOKEN),meta(ATA),meta(SystemProgram.programId)],data:await data('cancel')}
}
export async function buildGovernanceInstruction(input:{
 cluster:SolanaCluster;action:'stake'|'unstake'|'create_proposal'|'vote'|'finalize';
 authority:string;owner:string;mint:string;id?:bigint;amount?:bigint;support?:boolean;title?:string;uri?:string;duration?:bigint;
}){
 if(!['stake','unstake','create_proposal','vote','finalize'].includes(input.action))throw new Error('invalid_action')
 const id=program(input.cluster,'governance'),owner=pub(input.owner),mint=pub(input.mint)
 const dao=pda(id,utf8('dao'),pub(input.authority).toBytes(),mint.toBytes()),vault=pda(id,utf8('dao-vault'),dao.toBytes()),position=pda(id,utf8('stake'),dao.toBytes(),owner.toBytes())
 if(input.action==='stake'||input.action==='unstake'){
  if(input.amount===undefined||input.amount<=0n)throw new Error('invalid_amount')
  const accounts=[meta(owner,input.action==='stake',input.action==='stake'),meta(dao),meta(mint),meta(position,false,true),meta(ata(owner,mint),false,true),meta(vault,false,true),meta(TOKEN)]
  // Unstake also requires the owner's signature; no token approvals or delegated signing.
  accounts[0].isSigner=true
  if(input.action==='stake')accounts.push(meta(SystemProgram.programId))
  return {programId:id.toBase58(),accounts,data:await data(input.action,u64(input.amount))}
 }
 if(input.id===undefined)throw new Error('missing_proposal_id')
 const proposal=pda(id,utf8('proposal'),dao.toBytes(),u64(input.id))
 if(input.action==='finalize')return {programId:id.toBase58(),accounts:[meta(proposal,false,true)],data:await data('finalize')}
 if(input.action==='create_proposal'){
  if(!input.title?.trim()||!input.uri||!/^(https:\/\/|ipfs:\/\/)/.test(input.uri)||input.duration===undefined||input.duration<3600n||input.duration>2592000n)throw new Error('invalid_proposal')
  return {programId:id.toBase58(),accounts:[meta(owner,true,true),meta(dao,false,true),meta(position,false,true),meta(proposal,false,true),meta(SystemProgram.programId)],data:await data('create_proposal',u64(input.id),text(input.title,120),text(input.uri,200),i64(input.duration))}
 }
 if(typeof input.support!=='boolean')throw new Error('invalid_vote')
 const receipt=pda(id,utf8('vote'),proposal.toBytes(),owner.toBytes())
 return {programId:id.toBase58(),accounts:[meta(owner,true,true),meta(dao),meta(position,false,true),meta(proposal,false,true),meta(receipt,false,true),meta(SystemProgram.programId)],data:await data('vote',Uint8Array.of(input.support?1:0))}
}
