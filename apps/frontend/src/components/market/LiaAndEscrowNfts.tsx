import {useEffect,useState} from 'react'
import {LIA_OPS,MAINNET_ADDRESSES} from '../../config/contracts'

type Nft={identifier:string;name?:string;collection?:string;balance?:string|number;url?:string;media?:Array<{url?:string;thumbnailUrl?:string}>}
const API='https://api.multiversx.com'
const NFT=/^[A-Za-z0-9]{3,12}-[a-fA-F0-9]{6}-[a-fA-F0-9]{2,16}$/
function safeMedia(n:Nft){
 const raw=n.media?.[0]?.thumbnailUrl||n.media?.[0]?.url||n.url||''
 if(typeof raw!=='string')return ''
 if(/^ipfs:\/\/(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{20,})(\/[A-Za-z0-9._-]+)?$/.test(raw))return 'https://ipfs.io/ipfs/'+raw.slice(7)
 try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}
}
export default function LiaAndEscrowNfts(){
 const [owned,setOwned]=useState<Nft[]>([])
 const [escrow,setEscrow]=useState<Nft[]>([])
 const [failed,setFailed]=useState(false)
 const [loading,setLoading]=useState(true)
 useEffect(()=>{
  const controller=new AbortController()
  const read=async(address:string)=>{
   const r=await fetch(API+'/accounts/'+encodeURIComponent(address)+'/nfts?size=100',{signal:controller.signal,cache:'no-store'})
   if(!r.ok)throw Error('nft_index_unavailable')
   const json:unknown=await r.json()
   if(!Array.isArray(json))throw Error('invalid_nft_index')
   return json.filter((n):n is Nft=>Boolean(n)&&typeof n==='object'&&NFT.test(String((n as Nft).identifier||''))&&Number((n as Nft).balance??1)>0).slice(0,100)
  }
  Promise.all([read(LIA_OPS),read(MAINNET_ADDRESSES.nft_marketplace)])
   .then(([lia,market])=>{if(!controller.signal.aborted){setOwned(lia);setEscrow(market)}})
   .catch(()=>{if(!controller.signal.aborted)setFailed(true)})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false)})
  return()=>controller.abort()
 },[])
 return <section className="space-y-4 rounded-2xl border border-white/10 p-4 sm:p-6" aria-labelledby="lia-market-nfts">
  <div><h2 id="lia-market-nfts" className="text-lg font-semibold">NFT MultiversX · LIA et marketplace</h2>
   <p className="text-xs text-zinc-400">Inventaires lus directement sur la blockchain. Un NFT détenu par LIA n'est pas nécessairement en vente. Un NFT dans le contrat marketplace n'est pas un listing achetable sans vérification de getListing.</p></div>
  {loading&&<p role="status">Lecture des NFT MultiversX…</p>}
  {failed&&<p role="alert">Inventaires indisponibles. Aucun NFT ou listing n'est inventé.</p>}
  {!loading&&!failed&&<div className="space-y-5">
   {([{title:'Wallet LIA · NFT détenus',items:owned},{title:'Contrat marketplace · NFT déposés',items:escrow}] as const).map(group=><div key={group.title} className="space-y-2">
    <h3 className="text-sm font-semibold">{group.title} ({group.items.length}{group.items.length===100?'+':''})</h3>
    {group.items.length===0?<p className="text-xs text-zinc-400">Aucun NFT retourné par l'API pour cet inventaire.</p>:
     <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{group.items.slice(0,24).map(n=><li key={n.identifier} className="overflow-hidden rounded-xl border border-white/10">
      <div className="aspect-square bg-slate-900">{safeMedia(n)?<img src={safeMedia(n)} loading="lazy" alt={n.name||n.identifier} className="h-full w-full object-cover"/>:<div className="flex h-full items-center justify-center text-xs text-zinc-500">Aperçu indisponible</div>}</div>
      <div className="space-y-1 p-2"><p className="truncate text-xs font-semibold">{n.name||n.identifier}</p><p className="truncate text-[11px] text-zinc-400">{n.identifier}</p><a href={'https://explorer.multiversx.com/nfts/'+encodeURIComponent(n.identifier)} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-300 underline">Vérifier NFT</a></div>
     </li>)}</ul>}
   </div>)}
  </div>}
 </section>
}
