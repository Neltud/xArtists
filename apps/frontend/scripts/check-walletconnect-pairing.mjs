/**
 * Read-only WalletConnect pairing diagnostic. Does NOT authenticate, approve,
 * connect a real wallet, transfer, sign or broadcast a transaction.
 * Never logs a generated wc: URI, JWT, full error object or project ID.
 * Used only on CI/manual run to distinguish relay outage from frontend UX.
 */
import {WalletConnectV2Provider} from '@multiversx/sdk-wallet-connect-provider'
const projectId=process.env.VITE_WALLETCONNECT_PROJECT_ID || 'e07ac8e2a212711609b21dade4c9e37f'
const relays=['wss://relay.walletconnect.com','wss://relay.walletconnect.org']
const callbacks={onClientLogin:async()=>{},onClientLogout:async()=>{},onClientEvent:async()=>{}}
const timeout=(p,ms)=>Promise.race([p,new Promise((_,reject)=>{
  setTimeout(()=>reject(new Error('deadline')),ms).unref()
})])
const errors=[]
for(const [index,relay] of relays.entries()){
  let phase='init', provider
  try {
    provider=new WalletConnectV2Provider(callbacks,'1',relay,projectId,{
      metadata:{
        name:'xArtists',description:'Art and NFTs on MultiversX',
        url:'https://xartists.art/',icons:['https://xartists.art/icons/icon-192.png'],
      },
    })
    const initialized=await timeout(provider.init(),14000)
    if(!initialized)throw Error('init_false')
    console.log('RELAY_'+(index+1)+' INIT_OK')
    phase='connect'
    const pairing=await timeout(provider.connect(),14000)
    if(typeof pairing?.uri!=='string'||!pairing.uri.startsWith('wc:')||
        typeof pairing.approval!=='function')throw Error('invalid_uri')
    console.log('RELAY_'+(index+1)+' PAIR_URI_GENERATED (REDACTED)')
    process.exitCode=0
    // Do not call approval(), login(), sign* or send transactions.
    break
  }catch(e){
    // Intentionally coarse classification: no private tokens in CI logs.
    const message=String(e?.message||'').toLowerCase()
    const cause=/401|403|forbidden|unauthor|origin|project/.test(message)
      ?'PROJECT_AUTH'
      : /deadline/.test(message)?'TIMEOUT'
      :/invalid_uri|init_false/.test(message)?'INVALID_RESPONSE':'RELAY_OR_SDK_ERROR'
    console.log('RELAY_'+(index+1)+' '+phase+' '+cause)
    errors.push(cause)
    process.exitCode=2
  }finally{
    // Deliberately no wallet logout() or user session lifecycle,
    // and process exits after testing only a pending, unapproved pairing.
    provider=undefined
  }
}
console.log(process.exitCode===0?'PAIRING_PROBE_SUCCESS':'PAIRING_PROBE_BLOCKED_'+errors.join('_'))

// Stop relay sockets after this anonymous preflight. Never approve a session.
process.exit(process.exitCode ?? 0)
