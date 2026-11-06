/** XA World Rights: isolated YouTube read-only OAuth. Financial operations do not exist here. */
import {randomBytes,createHash} from 'node:crypto'
const SCOPE='https://www.googleapis.com/auth/youtube.readonly'
const COOKIE='__Host-xa_world_rights'
const hash=v=>createHash('sha256').update(v).digest('hex')
const random=()=>randomBytes(32).toString('base64url')
const channelId=/^UC[A-Za-z0-9_-]{22}$/
export function worldRightsConfig(env=process.env){
  const origins=['https://neltud.github.io','https://xartists-services-and-products.onrender.com']
  let callback=null
  try{const u=new URL(env.WORLD_RIGHTS_GOOGLE_REDIRECT_URI||'');if(u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==='/world-rights/youtube/callback')callback=u.href}catch{}
  const enabled=env.WORLD_RIGHTS_YOUTUBE_ENABLED==='1'&&Boolean(callback)&&/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(env.WORLD_RIGHTS_GOOGLE_CLIENT_ID||'')&&Boolean(env.WORLD_RIGHTS_GOOGLE_CLIENT_SECRET)
  return {enabled,origins,callback,clientId:env.WORLD_RIGHTS_GOOGLE_CLIENT_ID||'',clientSecret:env.WORLD_RIGHTS_GOOGLE_CLIENT_SECRET||''}
}
export function createWorldRightsHandler({env=process.env,fetcher=globalThis.fetch,now=Date.now}={}){
  const config=worldRightsConfig(env),pending=new Map(),sessions=new Map(),hits=new Map()
  const publicState=()=>({version:'0.6.0',youtube:config.enabled?'configured_readonly':'not_configured',payments:false,publishing:false,delivery:false})
  const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Cross-Origin-Opener-Policy':'unsafe-none'}
  function page(res,payload,origin,code=200,cookie){
    const nonce=random(),safe=JSON.stringify({type:'xa-world-rights',...payload}).replace(/</g,'\\u003c')
    res.writeHead(code,{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'nonce-"+nonce+"'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",...(cookie?{'Set-Cookie':cookie}:{})})
    res.end('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>XA World Rights</title><h1>XA World Rights</h1><p id="result"></p><script nonce="'+nonce+'">var d='+safe+';document.getElementById("result").textContent=d.message||d.status;'+(origin?'if(window.opener)window.opener.postMessage(d,'+JSON.stringify(origin)+');':'')+'</script><p>Vous pouvez fermer cette fenêtre. Aucun paiement, publication ou livraison.</p></html>')
  }
  function cookie(req){const raw=String(req.headers.cookie||'');const matches=raw.split(';').map(v=>v.trim()).filter(v=>v.startsWith(COOKIE+'='));if(matches.length!==1)return null;const v=matches[0].slice(COOKIE.length+1);return /^[A-Za-z0-9_-]{43}$/.test(v)?v:null}
  function prune(){
    const t=now();for(const [k,v]of pending)if(v.expires<=t)pending.delete(k)
    for(const [k,v]of sessions)if(v.expires<=t)sessions.delete(k)
    for(const [k,v]of hits)if(v.until<=t)hits.delete(k)
  }
  async function google(url,options){
    const u=new URL(url)
    if(!((u.origin==='https://oauth2.googleapis.com'&&u.pathname==='/token'&&!u.search)||(u.origin==='https://www.googleapis.com'&&['/youtube/v3/channels','/youtube/v3/videos'].includes(u.pathname))))throw Error('destination_not_allowed')
    const r=await fetcher(u.href,{...options,redirect:'error',signal:AbortSignal.timeout(10000)})
    if(!r.ok)throw Error('google_request_failed')
    const text=await r.text();if(text.length>262144)throw Error('google_response_too_large')
    const data=JSON.parse(text);if(!data||typeof data!=='object'||data.error)throw Error('google_response_invalid')
    return data
  }
  async function channels(token){
    const data=await google('https://www.googleapis.com/youtube/v3/channels?part=id&mine=true&maxResults=50',{headers:{Authorization:'Bearer '+token}})
    if(data.nextPageToken||!Array.isArray(data.items)||!data.items.length||data.items.some(c=>!channelId.test(c?.id||'')))throw Error('channel_verification_failed')
    return data.items.map(c=>c.id)
  }
  return async function handle(req,res,u){
    if(!u.pathname.startsWith('/world-rights/'))return false
    prune()
    if(u.pathname==='/world-rights/status'&&req.method==='GET'){
      res.writeHead(200,{...headers,'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});res.end(JSON.stringify(publicState()));return true
    }
    const origin=u.searchParams.get('returnOrigin'),trusted=config.origins.includes(origin)?origin:null
    if(req.method==='POST'&&u.pathname==='/world-rights/youtube/disconnect'){
      try{
        const sid=cookie(req),key=sid?hash(sid):'',session=sessions.get(key)
        if(!config.enabled||!session||req.headers.origin!==new URL(config.callback).origin||!String(req.headers['content-type']||'').startsWith('application/x-www-form-urlencoded'))throw Error('session_required')
        let body='';for await(const chunk of req){body+=chunk.toString();if(body.length>2048)throw Error('too_large')}
        const params=new URLSearchParams(body)
        if(params.getAll('nonce').length!==1||!session.disconnectNonce||params.get('nonce')!==session.disconnectNonce)throw Error('csrf')
        sessions.delete(key)
        page(res,{status:'disconnected',message:'Session locale déconnectée.'},session.origin,200,COOKIE+'=; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=0')
      }catch{page(res,{status:'error',message:'Déconnexion refusée.'},null,403)}
      return true
    }
    if(req.method!=='GET'){page(res,{status:'error',message:'Méthode interdite.'},trusted,405);return true}
    if([...u.searchParams.keys()].some((k,i,a)=>a.indexOf(k)!==i)){page(res,{status:'error',message:'Paramètres dupliqués.'},trusted,400);return true}
    if(!config.enabled){page(res,{status:'error',message:'YouTube non configuré : client Google, callback et activation opérateur requis.'},trusted,503);return true}
    const ip=req.socket?.remoteAddress||'unknown',limit=hits.get(ip)||{count:0,until:now()+60000};limit.count++;hits.set(ip,limit)
    if(limit.count>30||hits.size>5000){page(res,{status:'error',message:'Trop de requêtes. Réessayez plus tard.'},trusted,429);return true}
    try{
      if(u.pathname==='/world-rights/youtube/start'){
        if(!trusted)throw Error('untrusted_return_origin')
        if(pending.size>=1000)throw Error('capacity')
        const sid=random(),state=random(),verifier=random()
        pending.set(hash(state),{sid:hash(sid),origin:trusted,verifier,expires:now()+300000})
        const auth=new URL('https://accounts.google.com/o/oauth2/v2/auth')
        for(const [k,v]of Object.entries({client_id:config.clientId,redirect_uri:config.callback,response_type:'code',scope:SCOPE,state,access_type:'online',include_granted_scopes:'false',prompt:'consent',code_challenge:hash(verifier),code_challenge_method:'S256'}))auth.searchParams.set(k,v)
        // Google PKCE uses base64url(SHA256), not a hex digest.
        auth.searchParams.set('code_challenge',createHash('sha256').update(verifier).digest('base64url'))
        res.writeHead(302,{...headers,'Set-Cookie':COOKIE+'='+sid+'; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600',Location:auth.href});res.end();return true
      }
      if(u.pathname==='/world-rights/youtube/callback'){
        const state=u.searchParams.get('state')||'',entry=pending.get(hash(state)),sid=cookie(req)
        if(!entry||!sid||entry.sid!==hash(sid)||entry.expires<=now())throw Error('invalid_state')
        pending.delete(hash(state))
        if(u.searchParams.has('error')||!u.searchParams.get('code')||u.searchParams.get('code').length>8192||!['https://accounts.google.com',null].includes(u.searchParams.get('iss')))throw Error('authorization_denied')
        const body=new URLSearchParams({code:u.searchParams.get('code'),client_id:config.clientId,client_secret:config.clientSecret,redirect_uri:config.callback,grant_type:'authorization_code',code_verifier:entry.verifier})
        const token=await google('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString()})
        if(typeof token.access_token!=='string'||token.access_token.length>16384||/[\r\n]/.test(token.access_token)||!token.access_token||String(token.token_type).toLowerCase()!=='bearer'||typeof token.scope!=='string'||token.scope.trim()!==SCOPE||!Number.isInteger(token.expires_in)||token.expires_in<=0||token.expires_in>86400)throw Error('readonly_scope_required')
        const expires=now()+Math.min(token.expires_in,3600)*1000,ids=await channels(token.access_token)
        if(expires<=now()||sessions.size>=1000)throw Error('session_unavailable')
        sessions.set(hash(sid),{token:token.access_token,expires,origin:entry.origin})
        page(res,{status:'connected',channelIds:ids,copyrightVerified:false,message:'YouTube connecté en lecture seule. Aucun droit commercial vérifié.'},entry.origin);return true
      }
      const sid=cookie(req),key=sid?hash(sid):'',session=sessions.get(key)
      if(!trusted||!session||session.origin!==trusted||session.expires<=now())throw Error('session_required')
      if(u.pathname==='/world-rights/youtube/disconnect'){
        // Top-level page prompts a same-origin, explicit local disconnect using POST.
        const nonce=random();session.disconnectNonce=nonce
        res.writeHead(200,{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"})
        res.end('<!doctype html><html lang="fr"><meta charset="utf-8"><h1>Déconnecter XA World Rights</h1><form method="post" action="/world-rights/youtube/disconnect"><input type="hidden" name="nonce" value="'+nonce+'"><button>Confirmer la déconnexion locale</button></form><p>Aucun post ni consentement Google ne sera révoqué.</p></html>');return true
      }
      if(u.pathname==='/world-rights/youtube/inspect'){
        const videoId=u.searchParams.get('videoId')||'';if(!/^[A-Za-z0-9_-]{11}$/.test(videoId))throw Error('invalid_video')
        const ids=await channels(session.token),data=await google('https://www.googleapis.com/youtube/v3/videos?part=snippet&id='+encodeURIComponent(videoId),{headers:{Authorization:'Bearer '+session.token}})
        const v=Array.isArray(data.items)&&data.items.length===1?data.items[0]:null
        if(!v||v.id!==videoId||!ids.includes(v.snippet?.channelId))throw Error('video_channel_mismatch')
        page(res,{status:'inspected',videoId,channelId:v.snippet.channelId,copyrightVerified:false},trusted);return true
      }
      page(res,{status:'error',message:'Route inconnue.'},trusted,404)
    }catch{page(res,{status:'error',message:'Connexion ou vérification refusée. Recommencez depuis xArtists ; aucun droit commercial n’a été accordé.'},trusted,400)}
    return true
  }
}
