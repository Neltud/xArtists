import {useCallback,useEffect,useState} from 'react'
import {readSolanaPortfolio} from '../lib/solanaAccount.mjs'
export type SolanaPortfolio={owner:string;lamports:string;tokens:Array<{mint:string;amount:string;decimals:number;nft:boolean}>;nfts:Array<{mint:string;amount:string;decimals:number;nft:boolean}>;limited:boolean;checkedAt:number}
export function useSolanaPortfolio(address:string|null){
 const [data,setData]=useState<SolanaPortfolio|null>(null),[error,setError]=useState(false),[loading,setLoading]=useState(false),[revision,setRevision]=useState(0)
 const refresh=useCallback(()=>setRevision(v=>v+1),[])
 useEffect(()=>{
  setData(null);setError(false);setLoading(false)
  if(!address)return
  const controller=new AbortController();setLoading(true)
  const timer=setTimeout(()=>controller.abort(),12000)
  void readSolanaPortfolio(address,{signal:controller.signal}).then(value=>{if(!controller.signal.aborted)setData(value as SolanaPortfolio)}).catch(()=>{if(!controller.signal.aborted){setError(true);controller.abort()}}).finally(()=>{clearTimeout(timer);if(!controller.signal.aborted)setLoading(false)})
  const onAbort=()=>{setLoading(false);setError(true)}
  controller.signal.addEventListener('abort',onAbort,{once:true})
  return()=>{controller.signal.removeEventListener('abort',onAbort);clearTimeout(timer);controller.abort()}
 },[address,revision])
 // A new account must never inherit a previous account's figures, even for one render.
 return {data:data?.owner===address?data:null,error,loading,refresh}
}
