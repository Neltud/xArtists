import {readFileSync} from 'node:fs'
import {test} from 'node:test'
import assert from 'node:assert/strict'

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8')
const login=read('../src/components/LoginModal.tsx')
const status=read('../src/pages/GoLivePage.tsx')

test('a guest can browse and prepare a work without a fake account',()=>{
  assert.ok(login.includes('to="/marketplace" className="btn-primary'))
  assert.ok(login.includes('to="/studio" className="btn-secondary'))
  assert.match(login,/ne crée ni compte ni droit NFT/)
  assert.match(login,/comptes e-mail vérifiés et les abonnements sont en préparation/)
})

test('address paste remains read-only and a signer is still required',()=>{
  assert.match(login,/loginWithXPortalMainnet/)
  assert.match(login,/Une adresse erd1 collée sur xArtists permet la lecture seule/)
  assert.match(login,/une signature d'un wallet que tu contrôles sera nécessaire/)
  assert.doesNotMatch(login,/xartists_guest_receive|fiat_pack_pending|runGuestForFiat|L’ID temporaire/)
})

test('public service-status route labels xOrus, not retired LIA',()=>{
  assert.ok(status.includes('to="/xorus">xOrus · Paper'))
  assert.ok(!status.includes('to="/lia">'))
})
