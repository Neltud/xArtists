import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8')
const studio=read('../src/pages/StudioPage.tsx')
const media=read('../src/components/CreatorMediaUpload.tsx')
const factory=read('../src/pages/NftDistributorPage.tsx')
const rights=read('../src/pages/WorldRightsPage.tsx')

test('Studio starts with direct local-media selection instead of Drive instructions',()=>{
 assert.match(studio,/Importer une image, une vidéo ou une musique/)
 assert.ok(studio.indexOf('id="xa-studio-mint"') < studio.indexOf('<MainnetJourney'), 'file picker should appear first')
 assert.doesNotMatch(studio,/Google Drive/i)
 assert.match(studio,/to="\/marketplace"/)
 assert.match(studio,/id="xa-studio-mint"/)
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
 assert.match(factory,/Importez une image, une vidéo ou une musique/)
 assert.doesNotMatch(factory,/Google Drive/i)
 assert.match(rights,/ZIP premium/)
 assert.doesNotMatch(rights,/\.zip'/)
})

test('music files preview locally and use the signed upload pipeline',()=>{
 assert.match(media,/audio\/mpeg/)
 assert.match(media,/audio\/wav/)
 assert.match(media,/audio\/flac/)
 assert.match(media,/<audio src=\{preview\} controls/)
 assert.match(media,/signAccessMessage/)
 assert.match(media,/disabled=\{!enabled\|\|pending/)
})
