import {generateKeyPairSync,sign} from 'node:crypto'
import {createNeonAuthIdentityVerifier} from '../../src/neonAuthIdentity.mjs'
import {NEON_ACCOUNT_TARGET} from '../../src/neonAccountApi.mjs'

export function neonAccountFixture(){
  const target=NEON_ACCOUNT_TARGET
  const {publicKey,privateKey}=generateKeyPairSync('ed25519')
  const now=Math.floor(Date.now()/1000)
  const origin=new URL(target.authBase).origin
  const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url')
  const token=(subject='artist-a',changes={})=>{
    const payload={iss:origin,aud:origin,sub:subject,email:'private@example.test',
      emailVerified:true,banned:false,iat:now-10,exp:now+600,...changes}
    const message=encode({alg:'EdDSA',typ:'JWT',kid:'fixture'})+'.'+encode(payload)
    return message+'.'+sign(null,Buffer.from(message),privateKey).toString('base64url')
  }
  const verifierFactory=({baseUrl})=>createNeonAuthIdentityVerifier({baseUrl,
    clock:()=>now*1000,
    fetchImpl:async url=>{
      if(url!==target.authBase+'/.well-known/jwks.json')throw Error('unexpected_jwks_url')
      return Response.json({keys:[{...publicKey.export({format:'jwk'}),kid:'fixture',alg:'EdDSA'}]})
    },
  })
  const env={
    XARTISTS_SOURCE_SHA:'a'.repeat(40),
    WALLETLESS_ACCOUNT_SESSION_ENABLED:'1',WALLETLESS_DATABASE_TARGET_CONFIRMED:'1',
    NEON_BRANCH_ID:target.branch,NEON_AUTH_BASE_URL:target.authBase,
    XARTISTS_ACCOUNT_DATABASE_URL:'postgresql://'+target.role+
      ':fixture-only-password@'+target.pooledHost+'/'+target.database+'?sslmode=require',
  }
  return {env,now,token,verifierFactory}
}

export function accountRequest(app,path,{method='GET',token,headers={},body}={}){
  return app.fetch(new Request('https://account-sandbox.example'+path,{
    method,headers:{origin:'https://xartists.art',
      ...(token?{authorization:'Bearer '+token}:{}),...headers},
    ...(body===undefined?{}:{body}),
  }))
}
