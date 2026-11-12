import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8')
const studio=read('../src/pages/StudioPage.tsx')
const media=read('../src/components/CreatorMediaUpload.tsx')
const factory=read('../src/pages/NftDistributorPage.tsx')
const rights=read('../src/pages/WorldRightsPage.tsx')

test('Studio supports user-initiated Drive handoff but never auto-pulls private files',()=>{
 assert.match(studio,/Depuis Google Drive ou une collection privée/)
 assert.match(studio,/télécharge une copie sur ton appareil/)
 assert.match(studio,/to="\/create\/nft-factory"/)
 assert.match(studio,/to="\/create\/world-rights"/)
 assert.doesNotMatch(studio,/drive\.google\.com\/uc\?|drive\.googleapis\.com|googleapis\.com\/drive/)
 assert.match(studio,/canListOwnedNft\(\)/)
})
test('IPFS readiness retry reads config only and never enables uploads itself',()=>{
 assert.match(media,/Retester la connexion IPFS/)
 assert.match(media,/statusRetry/)
 assert.match(media,/\/v1\/studio\/media\/config/)
 assert.match(media,/window\.setTimeout\(\(\)=>c\.abort\(\),12000\)/)
 assert.match(media,/if\(active && c\.signal\.aborted\)setEnabled\(false\)/)
 assert.match(media,/disabled=\{!enabled\|\|pending/)
 assert.doesNotMatch(media,/VITE_PINATA_JWT|PINATA_JWT\s*=/)
})
test('NFT Factory and xRights display their license/mint limitations',()=>{
 assert.match(factory,/Des œuvres existent déjà dans votre Drive/)
 assert.match(factory,/Aucun accès Google Drive automatique/)
 assert.match(rights,/ZIP premium/)
 assert.doesNotMatch(rights,/\.zip'/)
})
