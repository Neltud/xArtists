import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react'
import {getWallets} from '@wallet-standard/app'
import {normalizeSolanaAccount} from '../lib/solanaAccount.mjs'
type StandardWallet=ReturnType<ReturnType<typeof getWallets>['get']>[number]
type WalletAccount=StandardWallet['accounts'][number]
type Session={wallet:StandardWallet;account:WalletAccount}
type Value={wallets:readonly StandardWallet[];session:Session|null;busy:boolean;failed:boolean;connect:(wallet:StandardWallet)=>Promise<void>;disconnect:()=>void}
const Context=createContext<Value>({wallets:[],session:null,busy:false,failed:false,connect:async()=>{},disconnect:()=>{}})
export function SolanaWalletProvider({children}:{children:ReactNode}){
 const [wallets,setWallets]=useState<readonly StandardWallet[]>([]),[session,setSession]=useState<Session|null>(null),[busy,setBusy]=useState(false),[failed,setFailed]=useState(false)
 const generation=useRef(0),stopEvents=useRef<(()=>void)|null>(null),activeWallet=useRef<StandardWallet|null>(null)
 const clear=()=>{generation.current++;activeWallet.current=null;stopEvents.current?.();stopEvents.current=null;setSession(null);setBusy(false)}
 useEffect(()=>{
  const registry=getWallets()
  const refresh=()=>setWallets(registry.get().filter(w=>w.chains.includes('solana:mainnet')&&'standard:connect' in w.features&&'standard:events' in w.features))
  refresh();const unregister=registry.on('register',refresh),remove=registry.on('unregister',(...removed)=>{if(activeWallet.current&&removed.includes(activeWallet.current))clear();refresh()})
  return()=>{generation.current++;unregister();remove();stopEvents.current?.()}
 },[])
 const connect=async(wallet:StandardWallet)=>{
  clear();activeWallet.current=wallet;const current=generation.current;setBusy(true);setFailed(false)
  try{
   if(!getWallets().get().includes(wallet)||!wallet.chains.includes('solana:mainnet'))throw new Error('wallet_unavailable')
   const feature=wallet.features['standard:connect'] as {connect:()=>Promise<{accounts:readonly WalletAccount[]}>}
   const events=wallet.features['standard:events'] as {on:(event:'change',cb:(event:{accounts?:readonly WalletAccount[]})=>void)=>()=>void}
   const result=await feature.connect()
   if(current!==generation.current)return
   if(!getWallets().get().includes(wallet))throw new Error('wallet_unavailable')
   const account=result.accounts.find(a=>normalizeSolanaAccount(a))
   if(!account)throw new Error('invalid_account')
   stopEvents.current=events.on('change',event=>{
    if(current!==generation.current||!event.accounts)return
    const account=event.accounts.find(a=>normalizeSolanaAccount(a))
    setSession(account?{wallet,account}:null)
   })
   setSession({wallet,account})
  }catch{if(current===generation.current){setSession(null);setFailed(true)}}
  finally{if(current===generation.current)setBusy(false)}
 }
 const disconnect=()=>{const wallet=session?.wallet;clear();setFailed(false);const feature=wallet?.features['standard:disconnect'] as {disconnect:()=>Promise<void>}|undefined;void feature?.disconnect().catch(()=>{})}
 return <Context.Provider value={{wallets,session,busy,failed,connect,disconnect}}>{children}</Context.Provider>
}
export const useSolanaWallet=()=>useContext(Context)
