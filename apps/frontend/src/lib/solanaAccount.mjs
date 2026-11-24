/** Public account reads only. No signing, RPC submission, or cached balances. */
const ALPHABET='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
export const SOLANA_RPC='https://api.mainnet-beta.solana.com'
export const SPL_TOKEN_PROGRAM='TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
export function decodePublicKey(value){
 if(typeof value!=='string'||!value.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/))return null
 let n=0n;for(const c of value)n=n*58n+BigInt(ALPHABET.indexOf(c))
 const bytes=[];while(n>0n){bytes.unshift(Number(n&255n));n>>=8n}
 for(const c of value){if(c!=='1')break;bytes.unshift(0)}
 return bytes.length===32?Uint8Array.from(bytes):null
}
export function normalizeSolanaAccount(account){
 const decoded=decodePublicKey(account?.address)
 if(!decoded||!Array.isArray(account?.chains)||!account.chains.includes('solana:mainnet')||(!ArrayBuffer.isView(account.publicKey)||account.publicKey.BYTES_PER_ELEMENT!==1)||account.publicKey.length!==32)return null
 if(!decoded.every((byte,i)=>byte===account.publicKey[i]))return null
 return account
}
export function formatSolanaUnits(raw,decimals=9){
 if(!/^\d+$/.test(String(raw))||!Number.isInteger(decimals)||decimals<0||decimals>255)return '—'
 const digits=BigInt(raw).toString().padStart(decimals+1,'0')
 if(decimals===0)return digits
 const fraction=digits.slice(-decimals).replace(/0+$/,'')
 return digits.slice(0,-decimals)+(fraction?'.'+fraction:'')
}
export async function readSolanaPortfolio(address,{signal,fetchImpl=fetch}={}){
 if(!decodePublicKey(address))throw new Error('invalid_account')
 let requestId=0
 const rpc=async(method,params)=>{
  const id=++requestId
  const response=await fetchImpl(SOLANA_RPC,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id,method,params}),signal,cache:'no-store'})
  if(!response.ok)throw new Error('solana_unavailable')
  const payload=await response.json()
  if(payload?.id!==id||payload?.error||!payload?.result)throw new Error('solana_unavailable')
  return payload.result
 }
 const [balance,accounts]=await Promise.all([
  rpc('getBalance',[address,{commitment:'confirmed'}]),
  rpc('getTokenAccountsByOwner',[address,{programId:SPL_TOKEN_PROGRAM},{encoding:'jsonParsed',commitment:'confirmed'}]),
 ])
 if(!Number.isSafeInteger(balance.value)||balance.value<0||!Array.isArray(accounts.value))throw new Error('invalid_account_read')
 const tokens=accounts.value.slice(0,48).map(row=>{
  const info=row?.account?.data?.parsed?.info,amount=info?.tokenAmount
  if(row?.account?.owner!==SPL_TOKEN_PROGRAM||info?.owner!==address||!decodePublicKey(info?.mint)||!/^\d{1,20}$/.test(amount?.amount??'')||!Number.isInteger(amount?.decimals)||amount.decimals<0||amount.decimals>255)return null
  if(BigInt(amount.amount)===0n||BigInt(amount.amount)>0xffffffffffffffffn)return null
  return {mint:info.mint,amount:amount.amount,decimals:amount.decimals,nft:false}
 }).filter(Boolean)
 const candidates=tokens.filter(t=>t.decimals===0&&t.amount==='1')
 if(candidates.length){
  const mints=await rpc('getMultipleAccounts',[candidates.map(t=>t.mint),{encoding:'jsonParsed',commitment:'confirmed'}])
  if(!Array.isArray(mints.value)||mints.value.length!==candidates.length)throw new Error('invalid_mint_read')
  mints.value.forEach((row,i)=>{const mint=row?.data?.parsed?.info;candidates[i].nft=row?.owner===SPL_TOKEN_PROGRAM&&row?.data?.parsed?.type==='mint'&&mint?.decimals===0&&mint?.supply==='1'&&mint?.isInitialized===true})
 }
 return {owner:address,lamports:String(balance.value),tokens,nfts:tokens.filter(t=>t.nft),limited:accounts.value.length>48,checkedAt:Date.now()}
}
