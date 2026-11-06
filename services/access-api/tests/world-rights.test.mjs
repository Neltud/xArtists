import assert from 'node:assert/strict'
import {test} from 'node:test'
import {Readable} from 'node:stream'
import {createWorldRightsHandler,worldRightsConfig} from '../src/worldRightsHttp.mjs'
const scope='https://www.googleapis.com/auth/youtube.readonly',cid='UC'+'a'.repeat(22),video='v'.repeat(11)
const env={WORLD_RIGHTS_YOUTUBE_ENABLED:'1',WORLD_RIGHTS_GOOGLE_CLIENT_ID:'test.apps.googleusercontent.com',WORLD_RIGHTS_GOOGLE_CLIENT_SECRET:'FIXTURE_SECRET',WORLD_RIGHTS_GOOGLE_REDIRECT_URI:'https://api.example/world-rights/youtube/callback'}
function response(){return {headers:{},code:0,body:'',writeHead(code,headers){this.code=code;this.headers=headers},end(body=''){this.body=body}}}
async function call(handler,path,{cookie='',method='GET',body='',origin=''}={}){
 const req=Readable.from(body?[body]:[]);req.method=method;req.headers={cookie,origin,'content-type':'application/x-www-form-urlencoded'};req.socket={remoteAddress:'127.0.0.1'}
 const res=response();await handler(req,res,new URL(path,'https://api.example'));return res
}
function setup(options={}){
 let clock=1000,calls=[]
 const fetcher=async(url,opts)=>{
  calls.push({url,opts})
  const body=url.includes('/token')?{access_token:'FIXTURE_ACCESS',token_type:'Bearer',scope:options.scope||scope,expires_in:3600}:url.includes('/channels')?{items:[{id:cid}]}:{items:[{id:video,snippet:{channelId:options.foreign?'UC'+'b'.repeat(22):cid}}]}
  return {ok:true,text:async()=>JSON.stringify(body)}
 }
 return {handler:createWorldRightsHandler({env,fetcher,now:()=>clock}),calls,advance(n){clock+=n}}
}
async function start(s){
 const r=await call(s.handler,'/world-rights/youtube/start?returnOrigin=https://neltud.github.io')
 assert.equal(r.code,302)
 return {auth:new URL(r.headers.Location),cookie:r.headers['Set-Cookie'].split(';')[0]}
}
async function connect(s,a){return call(s.handler,'/world-rights/youtube/callback?code=fixture-code&state='+a.auth.searchParams.get('state'),{cookie:a.cookie})}
test('status is off without operator config; never enables payment, publishing or delivery',async()=>{
 const h=createWorldRightsHandler({env:{}})
 const r=await call(h,'/world-rights/status');const body=JSON.parse(r.body)
 assert.equal(body.youtube,'not_configured');assert.equal(body.payments,false);assert.equal(body.publishing,false);assert.equal(body.delivery,false)
 assert.equal((await call(h,'/world-rights/youtube/start?returnOrigin=https://neltud.github.io')).code,503)
 assert.equal(worldRightsConfig({...env,WORLD_RIGHTS_GOOGLE_REDIRECT_URI:'http://api.example/callback'}).enabled,false)
})
test('Google start is readonly, PKCE S256 and a secure first-party cookie',async()=>{
 const s=setup(),a=await start(s)
 assert.equal(a.auth.origin,'https://accounts.google.com');assert.equal(a.auth.searchParams.get('scope'),scope)
 assert.equal(a.auth.searchParams.get('code_challenge_method'),'S256')
 assert.equal(a.auth.searchParams.get('code_challenge').length,43)
 assert.equal(s.calls.length,0)
 const r=await call(s.handler,'/world-rights/youtube/start?returnOrigin=https://neltud.github.io')
 assert.match(r.headers['Set-Cookie'],/Secure; HttpOnly; SameSite=Lax; Path=\//)
})
test('forged origins, duplicate parameters, missing cookie and state expiry block exchange',async()=>{
 const s=setup()
 assert.equal((await call(s.handler,'/world-rights/youtube/start?returnOrigin=https://evil.example')).code,400)
 assert.equal((await call(s.handler,'/world-rights/youtube/start?returnOrigin=https://neltud.github.io&returnOrigin=https://evil.example')).code,400)
 const a=await start(s)
 assert.equal((await connect(s,{...a,cookie:''})).code,400)
 s.advance(300001);assert.equal((await connect(s,a)).code,400);assert.equal(s.calls.length,0)
})
test('token stays server-side; callback replay does not exchange again',async()=>{
 const s=setup(),a=await start(s),r=await connect(s,a)
 assert.equal(r.code,200);assert.match(r.body,/connected/);assert(!r.body.includes('FIXTURE_ACCESS'));assert(!r.body.includes('FIXTURE_SECRET'))
 assert.equal((await connect(s,a)).code,400);assert.equal(s.calls.filter(x=>x.url.includes('/token')).length,1)
 const exchange=s.calls[0]
 assert.equal(exchange.opts.redirect,'error')
 assert(new URLSearchParams(exchange.opts.body).get('code_verifier'))
})
test('broader permissions are rejected',async()=>{
 const s=setup({scope:scope+' https://www.googleapis.com/auth/youtube'}),a=await start(s)
 assert.equal((await connect(s,a)).code,400)
 assert.equal(s.calls.length,1)
})
test('inspecting a selected video verifies its account channel but grants no copyright',async()=>{
 const s=setup(),a=await start(s);await connect(s,a)
 const r=await call(s.handler,'/world-rights/youtube/inspect?returnOrigin=https://neltud.github.io&videoId='+video,{cookie:a.cookie})
 assert.equal(r.code,200);assert.match(r.body,/inspected/);assert.match(r.body,/"copyrightVerified":false/)
 assert(s.calls.slice(1).every(c=>c.opts.headers.Authorization==='Bearer FIXTURE_ACCESS'))
})
test('foreign video, unsupported POST and missing session cannot grant access',async()=>{
 const s=setup({foreign:true}),a=await start(s);await connect(s,a)
 assert.equal((await call(s.handler,'/world-rights/youtube/inspect?returnOrigin=https://neltud.github.io&videoId='+video,{cookie:a.cookie})).code,400)
 assert.equal((await call(s.handler,'/world-rights/pay',{method:'POST'})).code,405)
 assert.equal((await call(s.handler,'/world-rights/youtube/inspect?returnOrigin=https://neltud.github.io&videoId='+video)).code,400)
})
test('disconnect requires same-origin POST and nonce; it never calls Google revoke',async()=>{
 const s=setup(),a=await start(s);await connect(s,a)
 const prompt=await call(s.handler,'/world-rights/youtube/disconnect?returnOrigin=https://neltud.github.io',{cookie:a.cookie})
 const nonce=/name="nonce" value="([^"]+)"/.exec(prompt.body)[1],before=s.calls.length
 assert.equal((await call(s.handler,'/world-rights/youtube/disconnect',{cookie:a.cookie,method:'POST',origin:'https://evil.example',body:'nonce='+nonce})).code,403)
 assert.equal((await call(s.handler,'/world-rights/youtube/disconnect',{cookie:a.cookie,method:'POST',origin:'https://api.example',body:'nonce='+nonce})).code,200)
 assert.equal(s.calls.length,before)
 assert.equal((await call(s.handler,'/world-rights/youtube/inspect?returnOrigin=https://neltud.github.io&videoId='+video,{cookie:a.cookie})).code,400)
})
