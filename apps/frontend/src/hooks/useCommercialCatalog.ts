/**
 * Bounded read-only catalogue lookup. It never carries identity, wallet or PSP
 * data, and a failed probe NEVER authorizes checkout or paid-report access.
 */
import {useEffect,useState} from 'react'

const API_FALLBACK='https://xartists-access-api.onrender.com'
type Sku='fiat_379'|'fiat_579'|'fiat_979'
type Track='pulse'|'yield'|'sentinel'
export type CommercialCatalog={
  schema:'xartists_public_commercial_catalog/v1'
  mode:'prelaunch'
  sale_open:false
  billing_checkout_enabled:false
  contract_purchase_enabled:false
  mint_enabled:false
  walletless_account_session_enabled:boolean
  xorus_private_analysis_enabled:boolean
  monthly_services:Array<{
    sku:Sku;tier:number;target_cents:number;currency:'EUR';interval:'month';
    requires_wallet:false;includes_nft:false;status:'not_available';
    checkout_enabled:false;scope_mapping_approved:false
  }>
  analysis_tracks:Array<{
    id:Track;fr:string;en:string;scope:string;
    report_delivery_status:'not_commercially_available';
    source_commercial_rights_verified:false
  }>
}

const isRecord=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v)
const price:Record<Sku,number>={fiat_379:379,fiat_579:579,fiat_979:979}
const scope:Record<Track,string>={pulse:'analysis:markets',yield:'analysis:defi',sentinel:'analysis:risk'}
const skus=Object.keys(price) as Sku[]
const tracks=Object.keys(scope) as Track[]

/** No unreviewed server response can be presented as an executable offer. */
export function parseCommercialCatalog(raw:unknown):CommercialCatalog|null{
  if(!isRecord(raw)||raw.schema!=='xartists_public_commercial_catalog/v1'||
    raw.mode!=='prelaunch'||raw.sale_open!==false||
    raw.billing_checkout_enabled!==false||raw.contract_purchase_enabled!==false||
    raw.mint_enabled!==false||
    typeof raw.walletless_account_session_enabled!=='boolean'||
    typeof raw.xorus_private_analysis_enabled!=='boolean'||!Array.isArray(raw.monthly_services)||
    !Array.isArray(raw.analysis_tracks)||raw.monthly_services.length!==3||
    raw.analysis_tracks.length!==3)return null
  const monthly=raw.monthly_services
  const catalogTracks=raw.analysis_tracks
  for(let i=0;i<skus.length;i++){
    const p=monthly[i],expected=skus[i]
    if(!isRecord(p)||p.sku!==expected||p.tier!==i+1||
      p.target_cents!==price[expected]||p.currency!=='EUR'||p.interval!=='month'||
      p.requires_wallet!==false||p.includes_nft!==false||
      p.status!=='not_available'||p.checkout_enabled!==false||
      p.scope_mapping_approved!==false)return null
  }
  for(let i=0;i<tracks.length;i++){
    const t=catalogTracks[i],id=tracks[i]
    if(!isRecord(t)||t.id!==id||t.scope!==scope[id]||
      typeof t.fr!=='string'||typeof t.en!=='string'||
      t.fr.length<1||t.fr.length>80||t.en.length<1||t.en.length>80||
      t.report_delivery_status!=='not_commercially_available'||
      t.source_commercial_rights_verified!==false)return null
  }
  return raw as CommercialCatalog
}
export type CommercialCatalogStatus='loading'|'verified'|'unavailable'

export function useCommercialCatalog(){
  const [catalog,setCatalog]=useState<CommercialCatalog|null>(null)
  const [status,setStatus]=useState<CommercialCatalogStatus>('loading')
  useEffect(()=>{
    const abort=new AbortController()
    const timer=window.setTimeout(()=>abort.abort(),6500)
    // The browser may use the official Render API when Pages has no Vite API env.
    const envBase=((import.meta.env.VITE_ACCESS_API_BASE as string|undefined)||'').trim()
    const base=(envBase||API_FALLBACK).replace(/\/+$/,'')
    void(async()=>{
      try{
        const response=await fetch(base+'/v1/commercial/catalog',{
          method:'GET',cache:'no-store',credentials:'omit',signal:abort.signal,
          headers:{Accept:'application/json'},
        })
        if(!response.ok)throw Error('catalog_unavailable')
        const body=parseCommercialCatalog(await response.json() as unknown)
        if(!body)throw Error('catalog_invalid')
        if(!abort.signal.aborted){setCatalog(body);setStatus('verified')}
      }catch{
        if(!abort.signal.aborted){setCatalog(null);setStatus('unavailable')}
      }finally{window.clearTimeout(timer)}
    })()
    return()=>{abort.abort();window.clearTimeout(timer)}
  },[])
  return {catalog,status}
}
