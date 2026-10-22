import {useEffect,useState} from 'react'
import {xPortalPairingHref,XPORTAL_DEEP_LINKS} from '../config/sdkDapp'
import {useCopy} from '../experience/state'
import Icon from '../experience/Icon'
/** Pairing QR stays on the device; mobile links are opened only after a real user gesture. */
export default function WalletPairing({uri}:{uri:string}){
 const c=useCopy(),[qr,setQr]=useState(''),[copied,setCopied]=useState(false),[copyFailed,setCopyFailed]=useState(false)
 useEffect(()=>{let active=true;setQr('');setCopied(false);import('qrcode').then(q=>q.toDataURL(uri,{width:280,margin:2,errorCorrectionLevel:'M',color:{dark:'#111710',light:'#ffffff'}})).then(url=>{if(active)setQr(url)}).catch(()=>{});return()=>{active=false}},[uri])
 const copy=async()=>{try{await navigator.clipboard.writeText(uri);setCopied(true);setCopyFailed(false)}catch{setCopyFailed(true)}}
 return <div className="xa-pairing"><div className="xa-pairing-qr">{qr?<img src={qr} alt="WalletConnect QR" width={240} height={240}/>:<span className="xa-loader"/>}</div><p>{c('pairingHint')}</p><a className="xa-button primary xa-pairing-open" href={xPortalPairingHref(uri)}><Icon name="wallet" size={18}/>{c('openXPortal')}<Icon name="external" size={16}/></a><button type="button" className="xa-button secondary" onClick={()=>void copy()}><Icon name={copied?'check':'layers'} size={16}/>{c(copied?'pairingCopied':'copyPairing')}</button>{copyFailed&&<textarea readOnly value={uri} aria-label={c('copyPairing')} onFocus={e=>e.currentTarget.select()} rows={3}/>}<a href={XPORTAL_DEEP_LINKS.storeAndOpen} target="_blank" rel="noreferrer" className="xa-pairing-install">{c('installXPortal')}</a></div>
}
