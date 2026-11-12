import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {loadSource} from './load-source.mjs'

const {safeXPortalLoginError}=loadSource('src/lib/xportalDiagnostics.ts')
const provider=readFileSync(new URL('../src/lib/xportalWc.ts',import.meta.url),'utf8')

test('SDK exceptions never disclose wc pairing URIs, symKeys, project IDs or relay URLs',()=>{
  const sensitive=[
    'Something bad wc:deadbeef@2?relay-protocol=irn&symKey=TOP_SECRET',
    'Forbidden 403 projectId=e07ac8e2a212711609b21dade4c9e37f URI wc:abcdef',
    'Timed out https://relay.walletconnect.com?topic=SECRET_TOP',
    'User rejected proposal wc:123?key=SECRET',
    'Error token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature',
  ]
  for(const reason of sensitive){
    const result=safeXPortalLoginError(new Error(reason))
    assert.ok(result.length>10)
    assert.doesNotMatch(result,/wc:|symKey|TOP_SECRET|e07ac8|eyJhbGci|topic=|https:\/\//)
    assert.notEqual(result,reason)
  }
})

test('public errors provide useful non-transactional recovery paths',()=>{
  assert.match(safeXPortalLoginError('unauthorized 401'),/Reown Cloud/)
  assert.match(safeXPortalLoginError('Pairing proposal failed'),/QR xPortal/)
  assert.match(safeXPortalLoginError('Relay network timeout'),/Relais WalletConnect/)
  assert.match(safeXPortalLoginError('user rejected'),/Connexion refusée/)
  assert.match(safeXPortalLoginError('Connexion annulée.'),/annulée/)
  assert.match(safeXPortalLoginError({message:'private token'}),/mode découverte sans wallet/)
  assert.match(provider,/const error=safeXPortalLoginError\(e\)/)
  assert.match(provider,/onProgress\?\.\(\{ phase: 'error', message: error \}\)/)
  assert.doesNotMatch(provider,/onProgress\?\.\(\{ phase: 'error', message: msg \}\)/)
})
