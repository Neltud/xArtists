import {useWalletNetwork,type WalletNetwork} from '../context/NetworkContext'
import {useNetworkCopy} from '../experience/networkCopy'
import {useSearchParams} from 'react-router-dom'
export function NetworkLogo({network}:{network:WalletNetwork}){
 return <img className="xa-network-logo" src={`${import.meta.env?.BASE_URL||'/'}brands/${network}.svg`} width="24" height="24" alt="" aria-hidden="true"/>
}
export default function NetworkSelector(){
 const {network,setNetwork}=useWalletNetwork(),n=useNetworkCopy(),[params,setParams]=useSearchParams()
 const choose=(value:WalletNetwork)=>{setNetwork(value);const next=new URLSearchParams(params);next.set('network',value);if(next.get('tab')==='opensea')next.delete('tab');setParams(next,{replace:true})}
 return <div className="xa-network-switch" role="group" aria-label={n('network')}>
  {(['multiversx','solana'] as const).map(value=><button key={value} type="button" aria-pressed={network===value} onClick={()=>choose(value)}>
   <NetworkLogo network={value}/><span>{value==='multiversx'?'MultiversX':'Solana'}</span>
  </button>)}
 </div>
}
