/** UI mirror of the fresh on-chain marketplace gate (never an authorization). */
import {useEffect,useState} from 'react'
import {canListBuyNft} from '../config/scStatus'
import {refreshRuntimeCodehashes} from '../lib/runtimeCodehash'
export function useMarketplaceReadiness(){
  const [ready,setReady]=useState(()=>canListBuyNft())
  useEffect(()=>{
    let active=true
    const sync=()=>{if(active)setReady(canListBuyNft())}
    window.addEventListener('xartists-codehash',sync)
    // The runtime gate still requires build allowlisting AND current hash/payable.
    void refreshRuntimeCodehashes().then(sync,()=>sync())
    return()=>{active=false;window.removeEventListener('xartists-codehash',sync)}
  },[])
  return ready
}
