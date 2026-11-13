/**
 * Read-only proof that the account store has tables required for
 * walletless sessions and self-profile reads. No migrations or customer rows.
 */
const QUERY="SELECT "+
  "to_regclass('public.xa_user_accounts') IS NOT NULL AS accounts,"+
  "to_regclass('public.xa_account_identities') IS NOT NULL AS identities,"+
  "to_regclass('public.xa_account_wallets') IS NOT NULL AS wallets,"+
  "to_regclass('public.xa_fiat_subscriptions') IS NOT NULL AS subscriptions"
export function createWalletlessSchemaProbe({enabled=false,pool,clock=Date.now,ttlMs=15000}={}){
  let expires=0,wasReady=false,inflight=null
  return Object.freeze({
    async check(){
      if(!enabled||typeof pool?.query!=='function'||typeof clock!=='function')
        return false
      const now=clock()
      if(!Number.isSafeInteger(now)||now<0)return false
      if(now<expires)return wasReady
      if(inflight)return inflight
      inflight=(async()=>{
        let ready=false
        try{
          const result=await pool.query(QUERY)
          const r=result?.rows?.[0]
          ready=result?.rows?.length===1&&r?.accounts===true&&
            r?.identities===true&&r?.wallets===true&&r?.subscriptions===true
        }catch{ready=false}
        wasReady=ready
        const end=clock()
        expires=Number.isSafeInteger(end)?end+ttlMs:0
        return wasReady
      })()
      try{return await inflight}
      finally{inflight=null}
    },
  })
}
