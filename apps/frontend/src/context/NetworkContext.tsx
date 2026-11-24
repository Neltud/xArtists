import {createContext,useContext,useEffect,useState,type ReactNode} from 'react'
import {useLocation} from 'react-router-dom'
export type WalletNetwork='multiversx'|'solana'
const NetworkContext=createContext<{network:WalletNetwork;setNetwork:(v:WalletNetwork)=>void}>({network:'multiversx',setNetwork:()=>{}})
function initialNetwork():WalletNetwork{
 if(typeof window==='undefined')return 'multiversx'
 const requested=new URLSearchParams(window.location.search).get('network')
 if(requested==='solana'||requested==='multiversx')return requested
 try{return localStorage.getItem('xa-network')==='solana'?'solana':'multiversx'}catch{return 'multiversx'}
}
export function NetworkProvider({children}:{children:ReactNode}){
 const location=useLocation()
 const [network,update]=useState<WalletNetwork>(initialNetwork)
 const setNetwork=(value:WalletNetwork)=>{if(value!=='solana'&&value!=='multiversx')return;update(value);try{localStorage.setItem('xa-network',value)}catch{}}
 useEffect(()=>{const value=new URLSearchParams(location.search).get('network');if(value==='multiversx'||value==='solana')setNetwork(value)},[location.search])
 return <NetworkContext.Provider value={{network,setNetwork}}>{children}</NetworkContext.Provider>
}
export const useWalletNetwork=()=>useContext(NetworkContext)
