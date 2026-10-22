/** WalletConnect approval is a handshake, not a provider login. Always finalize through the SDK. */
export interface LoginProvider {
  login: (options:{approval:()=>Promise<unknown>})=>Promise<unknown>
  getAddress?:()=>string|Promise<string>
  address?:string
  logout?:()=>Promise<unknown>
}
export function withDeadline<T>(operation:Promise<T>,ms:number,message:string,signal?:AbortSignal):Promise<T>{
 return new Promise((resolve,reject)=>{
  const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',cancel)}
  const cancel=()=>{cleanup();reject(new Error('Connexion annulée.'))}
  const timer=setTimeout(()=>{cleanup();reject(new Error(message))},ms)
  // Observe late failures even when cancellation happened before this call.
  operation.then(v=>{cleanup();resolve(v)},e=>{cleanup();reject(e)})
  if(signal?.aborted){cancel();return}
  signal?.addEventListener('abort',cancel,{once:true})
 })
}
export async function activateWalletSession(provider:LoginProvider,approval:()=>Promise<unknown>,signal?:AbortSignal,timeoutMs=120000):Promise<string>{
 if(signal?.aborted)throw new Error('Connexion annulée.')
 const activation=provider.login({approval})
 try{
  await withDeadline(activation,timeoutMs,'Connexion expirée. Réessayez dans xPortal.',signal)
 }catch(error){
  // A late phone approval must not recreate a session after closing or timing out.
  void activation.then(()=>provider.logout?.()).catch(()=>{})
  throw error
 }
 if(signal?.aborted)throw new Error('Connexion annulée.')
 const address=String(provider.getAddress?await provider.getAddress():provider.address||'').trim()
 if(!/^erd1[a-z0-9]{58}$/i.test(address))throw new Error('Adresse xPortal invalide — réessayez la connexion.')
 return address
}
