/** External Solana catalogue. Orders remain on the source marketplace. */
import {useEffect,useRef,useState,type FormEvent} from 'react'
import {useNetworkCopy} from '../../experience/networkCopy'
import Icon from '../../experience/Icon'
type Item={identifier:string;name:string;image_url:string|null;opensea_url:string;collection:string}
type Preview={ok:true;chain:'solana';collection:string;collection_name:string;collection_url:string;mode:'read_only';on_site_order_enabled:false;items:Item[]}
const API_BASE=(import.meta.env.VITE_API_BASE as string|undefined)?.replace(/\/$/,'')||'https://xartists-access-api.onrender.com'
const collectionPattern=/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/
function sourceUrl(value:unknown){try{const url=new URL(String(value));return url.protocol==='https:'&&url.hostname==='opensea.io'&&!url.username&&!url.password?url.href:null}catch{return null}}
export default function OpenSeaCollectionPanel(){
 const n=useNetworkCopy(),chain='solana' as const,[slug,setSlug]=useState(''),[result,setResult]=useState<Preview|null>(null),[error,setError]=useState(false),[loading,setLoading]=useState(false)
 const pending=useRef<AbortController|null>(null)
 useEffect(()=>()=>pending.current?.abort(),[])
 const clear=()=>{pending.current?.abort();setResult(null);setError(false);setLoading(false)}
 async function onSubmit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();clear()
  const cleanSlug=slug.trim().toLowerCase()
  if(!collectionPattern.test(cleanSlug)){setError(true);return}
  const controller=new AbortController();pending.current=controller;setLoading(true)
  const timer=setTimeout(()=>controller.abort('timeout'),10000)
  try{
   const url=new URL('/v1/marketplace/opensea/collection',API_BASE+'/');url.searchParams.set('chain',chain);url.searchParams.set('slug',cleanSlug)
   const response=await fetch(url.toString(),{cache:'no-store',signal:controller.signal})
   const payload=await response.json() as Partial<Preview>
   if(!response.ok||payload.ok!==true||payload.chain!==chain||payload.collection!==cleanSlug||payload.mode !== 'read_only'||payload.on_site_order_enabled !== false||!Array.isArray(payload.items))throw new Error('unavailable')
   if(controller.signal.aborted)return
   setResult({...payload,items:payload.items.slice(0,20).filter(i=>i&&typeof i.identifier==='string'&&sourceUrl(i.opensea_url))} as Preview)
  }catch{if(!controller.signal.aborted||controller.signal.reason==='timeout')setError(true)}
  finally{clearTimeout(timer);if(pending.current===controller){pending.current=null;setLoading(false)}}
 }
 return <section className="xa-task-surface xa-opensea-collection" aria-label="OpenSea · Solana">
  <header className="xa-task-toolbar"><h2>OpenSea · Solana</h2><span className="xa-token-state">{n('readOnly')}</span></header>
  <form onSubmit={onSubmit} className="xa-collection-search">
   <label htmlFor="xa-solana-collection">{n('collectionSlug')}</label>
   <div><input id="xa-solana-collection" value={slug} maxLength={64} autoComplete="off" autoCapitalize="none" required pattern="[a-z0-9][a-z0-9-]{0,63}" onChange={e=>{clear();setSlug(e.target.value)}} placeholder="collection-slug"/><button type="submit" className="xa-button primary" disabled={loading}>{loading?n('loading'):n('search')}</button></div>
  </form>
  {error&&<p role="alert" className="xa-task-status">{n('unavailable')}</p>}
  {result&&<><h3>{result.collection_name}</h3>{result.items.length===0?<p>{n('noResults')}</p>:<div className="xa-solana-collection-grid">{result.items.map(item=><a key={item.identifier} href={sourceUrl(item.opensea_url)!} target="_blank" rel="noopener noreferrer" className="xa-solana-collection-card">
   {item.image_url?.startsWith('https://')?<img src={item.image_url} alt={item.name||item.identifier} loading="lazy"/>:<Icon name="cube" size={40}/>}<strong>{item.name||item.identifier}</strong><span>{n('explorer')} ↗</span>
  </a>)}</div>}</>}
  <details className="xa-task-details"><summary>{n('details')}</summary><p>{n('marketClosed')} {n('unsupportedMint')}</p></details>
  <a href="https://opensea.io/" target="_blank" rel="noopener noreferrer" className="xa-text-link">OpenSea ↗</a>
 </section>
}
